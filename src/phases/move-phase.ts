import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { applyAbAttrs, applyPostMoveUsedAbAttrs, applyPreAttackAbAttrs, BlockRedirectAbAttr, IncreasePpAbAttr, PokemonTypeChangeAbAttr, PostMoveUsedAbAttr, RedirectMoveAbAttr } from "#app/data/ability";
import { CommonAnim } from "#app/data/battle-anims";
import { BattlerTagLapseType, CenterOfAttentionTag } from "#app/data/battler-tags";
import { allMoves, applyMoveAttrs, BypassRedirectAttr, BypassSleepAttr, ChargeAttr, CopyMoveAttr, HealStatusEffectAttr, MoveFlags, PreMoveMessageAttr } from "#app/data/move";
import { SpeciesFormChangePreMoveTrigger } from "#app/data/pokemon-forms";
import { getStatusEffectActivationText, getStatusEffectHealText } from "#app/data/status-effect";
import { Type } from "#app/data/type";
import { getTerrainBlockMessage } from "#app/data/weather";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Moves } from "#app/enums/moves";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveUsedEvent } from "#app/events/battle-scene";
import Pokemon, { MoveResult, PokemonMove, TurnMove } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlePhase } from "#app/phases/battle-phase";
import { CommonAnimPhase } from "#app/phases/common-anim-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import * as Utils from "#app/utils";
import i18next from "i18next";

export class MovePhase extends BattlePhase {
  protected _pokemon: Pokemon;
  protected _move: PokemonMove;
  protected _targets: BattlerIndex[];
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected failed: boolean = false;
  protected cancelled: boolean = false;

  public get pokemon(): Pokemon {
    return this._pokemon;
  }

  protected set pokemon(pokemon: Pokemon) {
    this._pokemon = pokemon;
  }

  public get move(): PokemonMove {
    return this._move;
  }

  protected set move(move: PokemonMove) {
    this._move = move;
  }

  public get targets(): BattlerIndex[] {
    return this._targets;
  }

  protected set targets(targets: BattlerIndex[]) {
    this._targets = targets;
  }

  /**
   * @param followUp Indicates that the move being uses is a "follow-up" - for example, a move being used by Metronome or Dancer.
   *                 Follow-ups bypass a few failure conditions, including flinches, sleep/paralysis/freeze and volatile status checks, etc.
   */
  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, followUp: boolean = false, ignorePp: boolean = false) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = followUp;
    this.ignorePp = ignorePp;
  }

  /**
   * Checks if the pokemon is active, if the move is usable, and that the move is targetting something.
   * @param ignoreDisableTags `true` to not check if the move is disabled
   * @returns `true` if all the checks pass
   */
  public canMove(ignoreDisableTags: boolean = false): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon, this.ignorePp, ignoreDisableTags) && !!this.targets.length;
  }

  /**Signifies the current move should fail but still use PP */
  public fail(): void {
    this.failed = true;
  }

  /**Signifies the current move should cancel and retain PP */
  public cancel(): void {
    this.cancelled = true;
  }

  public start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    // Check if move is unusable (e.g. because it's out of PP due to a mid-turn Spite).
    if (!this.canMove(true)) {
      if (this.pokemon.isActive(true) && this.move.ppUsed >= this.move.getMovePp()) {
        this.fail();
        this.showMoveText();
        this.showFailedText();
      }

      return this.end();
    }

    this.pokemon.turnData.acted = true;

    // Reset hit-related turn data when starting follow-up moves (e.g. Metronomed moves, Dancer repeats)
    if (this.followUp) {
      this.pokemon.turnData.hitsLeft = -1;
      this.pokemon.turnData.hitCount = 0;
    }

    // Check move to see if arena.ignoreAbilities should be true.
    if (!this.followUp) {
      if (this.move.getMove().checkFlag(MoveFlags.IGNORE_ABILITIES, this.pokemon, null)) {
        this.scene.arena.setIgnoreAbilities(true, this.pokemon.getBattlerIndex());
      }
    }

    this.resolveRedirectTarget();

    this.resolveCounterAttackTarget();

    this.resolvePreMoveStatusEffects();

    this.lapsePreMoveAndMoveTags();

    this.resolveFinalPreMoveCancellationChecks();

    if (this.cancelled || this.failed) {
      this.handlePreMoveFailures();
    } else {
      this.useMove();
    }

    this.end();
  }

  /** Check for cancellation edge cases - no targets remaining, or {@linkcode Moves.NONE} is in the queue */
  protected resolveFinalPreMoveCancellationChecks() {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();

    if (targets.length === 0 || (moveQueue.length && moveQueue[0].move === Moves.NONE)) {
      this.showFailedText();
      this.cancelled = true;
    }
  }

  public getActiveTargetPokemon() {
    return this.scene.getField(true).filter(p => this.targets.includes(p.getBattlerIndex()));
  }

  /**
   * Handles {@link StatusEffect.SLEEP Sleep}/{@link StatusEffect.PARALYSIS Paralysis}/{@link StatusEffect.FREEZE Freeze} rolls and side effects.
   */
  protected resolvePreMoveStatusEffects() {
    if (!this.followUp && this.pokemon.status && !this.pokemon.status.isPostTurn()) {
      this.pokemon.status.incrementTurn();
      let activated = false;
      let healed = false;

      switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        if (!this.pokemon.randSeedInt(4)) {
          activated = true;
          this.cancelled = true;
        }
        break;
      case StatusEffect.SLEEP:
        applyMoveAttrs(BypassSleepAttr, this.pokemon, null, this.move.getMove());
        healed = this.pokemon.status.turnCount === this.pokemon.status.cureTurn;
        activated = !healed && !this.pokemon.getTag(BattlerTagType.BYPASS_SLEEP);
        this.cancelled = activated;
        break;
      case StatusEffect.FREEZE:
        healed = !!this.move.getMove().findAttr(attr => attr instanceof HealStatusEffectAttr && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE)) || !this.pokemon.randSeedInt(5);
        activated = !healed;
        this.cancelled = activated;
        break;
      }

      if (activated) {
        this.scene.queueMessage(getStatusEffectActivationText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.POISON + (this.pokemon.status.effect - 1)));
      } else if (healed) {
        this.scene.queueMessage(getStatusEffectHealText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
        this.pokemon.resetStatus();
        this.pokemon.updateInfo();
      }
    }
  }

  /**
   * Lapse {@linkcode BattlerTagLapseType.PRE_MOVE PRE_MOVE} tags that trigger before a move is used, regardless of whether or not it failed.
   * Also lapse {@linkcode BattlerTagLapseType.MOVE MOVE} tags if the move should be successful.
   */
  protected lapsePreMoveAndMoveTags() {
    this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

    // TODO: does this intentionally happen before the no targets/Moves.NONE on queue cancellation case is checked?
    if (!this.followUp && this.canMove() && !this.cancelled) {
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
    }
  }

  protected useMove() {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();

    // form changes happen even before we know that the move wll execute.
    this.scene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

    this.showMoveText();

    // TODO: Clean up implementation of two-turn moves.
    if (moveQueue.length > 0) { // Using .shift here clears out two turn moves once they've been used
      this.ignorePp = moveQueue.shift()?.ignorePP ?? false;
    }

    // "commit" to using the move, deducting PP.
    if (!this.ignorePp) {
      const ppUsed = 1 + this.getPpIncreaseFromPressure(targets);

      this.move.usePp(ppUsed);
      this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
    }

    // Update the battle's "last move" pointer, unless we're currently mimicking a move.
    if (!allMoves[this.move.moveId].hasAttr(CopyMoveAttr)) {
      this.scene.currentBattle.lastMove = this.move.moveId;
    }

    /**
     * Determine if the move is successful (meaning that its damage/effects can be attempted)
     * by checking that all of the following are true:
     * - Conditional attributes of the move are all met
     * - The target's `ForceSwitchOutImmunityAbAttr` is not triggered (see {@linkcode Move.prototype.applyConditions})
     * - Weather does not block the move
     * - Terrain does not block the move
     *
     * TODO: These steps are straightforward, but the implementation below is extremely convoluted.
     */

    const move = this.move.getMove();

    /**
     * Move conditions assume the move has a single target
     * TODO: is this sustainable?
     */
    const passesConditions = move.applyConditions(this.pokemon, targets[0], move);
    const failedDueToWeather: boolean = this.scene.arena.isMoveWeatherCancelled(this.pokemon, move);
    const failedDueToTerrain: boolean = this.scene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, move);

    const success = passesConditions && !failedDueToWeather && !failedDueToTerrain;

    /**
     * If the move has not failed, trigger ability-based user type changes and then execute it.
     *
     * Notably, Roar, Whirlwind, Trick-or-Treat, and Forest's Curse will trigger these type changes even
     * if the move fails.
     */
    if (success) {
      applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());
      this.scene.unshiftPhase(new MoveEffectPhase(this.scene, this.pokemon.getBattlerIndex(), this.targets, this.move));

    } else {
      if ([ Moves.ROAR, Moves.WHIRLWIND, Moves.TRICK_OR_TREAT, Moves.FORESTS_CURSE ].includes(this.move.moveId)) {
        applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());
      }

      this.pokemon.pushMoveHistory({ move: this.move.moveId, targets: this.targets, result: MoveResult.FAIL, virtual: this.move.virtual });

      let failedText: string | undefined;
      const failureMessage = move.getFailedText(this.pokemon, targets[0], move, new Utils.BooleanHolder(false));

      if (failureMessage) {
        failedText = failureMessage;
      } else if (failedDueToTerrain) {
        failedText = getTerrainBlockMessage(this.pokemon, this.scene.arena.getTerrainType());
      }

      this.showFailedText(failedText);
    }

    // Handle Dancer, which triggers immediately after a move is used (rather than waiting on `this.end()`).
    // Note that the `!this.followUp` check here prevents an infinite Dancer loop.
    if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !this.followUp) {
      this.scene.getField(true).forEach(pokemon => {
        applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
      });
    }
  }

  /**
   * Queues a {@linkcode MoveEndPhase} if the move wasn't a {@linkcode followUp} and {@linkcode canMove()} returns `true`,
   * then ends the phase.
   */
  public end() {
    if (!this.followUp && this.canMove()) {
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.getBattlerIndex()));
    }

    super.end();
  }

  /**
   * Applies PP increasing abilities (currently only {@link Abilities.PRESSURE Pressure}) if they exist on the target pokemon.
   * Note that targets must include only active pokemon.
   *
   * TODO: This hardcodes the PP increase at 1 per opponent, rather than deferring to the ability.
   */
  public getPpIncreaseFromPressure(targets: Pokemon[]) {
    const foesWithPressure = this.pokemon.getOpponents().filter(o => targets.includes(o) && o.isActive(true) && o.hasAbilityWithAttr(IncreasePpAbAttr));
    return foesWithPressure.length;
  }

  /**
   * Modifies `this.targets` in place, based upon:
   * - Move redirection abilities, effects, etc.
   * - Counterattacks, which pass a special value into the `targets` constructor param (`[`{@linkcode BattlerIndex.ATTACKER}`]`).
   */
  protected resolveRedirectTarget() {
    if (this.targets.length === 1) {
      const currentTarget = this.targets[0];
      const redirectTarget = new Utils.NumberHolder(currentTarget);

      // check move redirection abilities of every pokemon *except* the user.
      this.scene.getField(true).filter(p => p !== this.pokemon).forEach(p => applyAbAttrs(RedirectMoveAbAttr, p, null, false, this.move.moveId, redirectTarget));

      /** `true` if an Ability is responsible for redirecting the move to another target; `false` otherwise */
      let redirectedByAbility = (currentTarget !== redirectTarget.value);

      // check for center-of-attention tags (note that this will override redirect abilities)
      this.pokemon.getOpponents().forEach(p => {
        const redirectTag = p.getTag(CenterOfAttentionTag);

        // TODO: don't hardcode this interaction.
        // Handle interaction between the rage powder center-of-attention tag and moves used by grass types/overcoat-havers (which are immune to RP's redirect)
        if (redirectTag && (!redirectTag.powder || (!this.pokemon.isOfType(Type.GRASS) && !this.pokemon.hasAbility(Abilities.OVERCOAT)))) {
          redirectTarget.value = p.getBattlerIndex();
          redirectedByAbility = false;
        }
      });

      if (currentTarget !== redirectTarget.value) {
        const bypassRedirectAttrs = this.move.getMove().getAttrs(BypassRedirectAttr);
        bypassRedirectAttrs.forEach((attr) => {
          if (!attr.abilitiesOnly || redirectedByAbility) {
            redirectTarget.value = currentTarget;
          }
        });

        if (this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr)) {
          redirectTarget.value = currentTarget;
          this.scene.unshiftPhase(new ShowAbilityPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr)));
        }

        this.targets[0] = redirectTarget.value;
      }
    }
  }

  /**
   * Counter-attacking moves pass in `[`{@linkcode BattlerIndex.ATTACKER}`]` into the constructor's `targets` param.
   * This function modifies `this.targets` to reflect the actual battler index of the user's last
   * attacker.
   *
   * If there is no last attacker, or they are no longer on the field, a message is displayed and the
   * move is marked for failure.
   */
  protected resolveCounterAttackTarget() {
    if (this.targets.length === 1 && this.targets[0] === BattlerIndex.ATTACKER) {
      if (this.pokemon.turnData.attacksReceived.length) {
        const attacker = this.pokemon.scene.getPokemonById(this.pokemon.turnData.attacksReceived[0].sourceId);

        if (attacker?.isActive(true)) {
          this.targets[0] = attacker.getBattlerIndex();
        }

        // account for metal burst and comeuppance hitting remaining targets in double battles
        // counterattack will redirect to remaining ally if original attacker faints
        if (this.scene.currentBattle.double && this.move.getMove().hasFlag(MoveFlags.REDIRECT_COUNTER)) {
          if (this.scene.getField()[this.targets[0]].hp === 0) {
            const opposingField = this.pokemon.isPlayer() ? this.scene.getEnemyField() : this.scene.getPlayerField();
            this.targets[0] = opposingField.find(p => p.hp > 0)?.getBattlerIndex() ?? BattlerIndex.ATTACKER;
          }
        }
      }

      if (this.targets[0] === BattlerIndex.ATTACKER) {
        this.fail();
        this.showMoveText();
        this.showFailedText();
      }
    }
  }

  /**
   * Handles the case where the move was cancelled or failed:
   * - Uses PP if the move failed (not cancelled) and should use PP (failed moves are not affected by {@link Abilities.PRESSURE Pressure})
   * - Records a cancelled OR failed move in move history, so abilities like {@link Abilities.TRUANT Truant} don't trigger on the
   *   next turn and soft-lock.
   * - Lapses `MOVE_EFFECT` tags:
   *   - Semi-invulnerable battler tags (Fly/Dive/etc.) are intended to lapse on move effects, but also need
   *     to lapse on move failure/cancellation.
   *
   *     TODO: ...this seems weird.
   * - Lapses `AFTER_MOVE` tags:
   *   - This handles the effects of {@link Moves.SUBSTITUTE Substitute}
   * - Removes the second turn of charge moves
   *
   *   TODO: handle charge moves more gracefully
   */
  protected handlePreMoveFailures() {
    if (this.cancelled || this.failed) {
      if (this.failed) {
        const ppUsed = this.ignorePp ? 0 : 1;

        if (ppUsed) {
          this.move.usePp();
        }

        this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
      }

      this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

      this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
      this.pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);

      this.pokemon.getMoveQueue().shift();
    }
  }

  /**
   * Displays the move's usage text to the player, unless it's a charge turn (ie: {@link Moves.SOLAR_BEAM Solar Beam}),
   * the pokemon is on a recharge turn (ie: {@link Moves.HYPER_BEAM Hyper Beam}), or a 2-turn move was interrupted (ie: {@link Moves.FLY Fly}).
   */
  protected showMoveText(): void {
    if (this.move.moveId === Moves.NONE) {
      return;
    }

    if (this.move.getMove().hasAttr(ChargeAttr)) {
      const lastMove = this.pokemon.getLastXMoves() as TurnMove[];
      if (!lastMove.length || lastMove[0].move !== this.move.getMove().id || lastMove[0].result !== MoveResult.OTHER) {
        this.scene.queueMessage(i18next.t("battle:useMove", {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
          moveName: this.move.getName()
        }), 500);
        return;
      }
    }

    if (this.pokemon.getTag(BattlerTagType.RECHARGING || BattlerTagType.INTERRUPTED)) {
      return;
    }

    this.scene.queueMessage(i18next.t("battle:useMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
      moveName: this.move.getName()
    }), 500);
    applyMoveAttrs(PreMoveMessageAttr, this.pokemon, this.pokemon.getOpponents()[0], this.move.getMove());
  }

  protected showFailedText(failedText?: string): void {
    this.scene.queueMessage(failedText ?? i18next.t("battle:attackFailed"));
  }
}
