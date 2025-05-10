import { BattlerIndex } from "#app/battle";
import { globalScene } from "#app/global-scene";
import {
  applyAbAttrs,
  applyPostMoveUsedAbAttrs,
  applyPreAttackAbAttrs,
  BlockRedirectAbAttr,
  IncreasePpAbAttr,
  PokemonTypeChangeAbAttr,
  PostMoveUsedAbAttr,
  RedirectMoveAbAttr,
  ReduceStatusEffectDurationAbAttr,
} from "#app/data/abilities/ability";
import type { DelayedAttackTag } from "#app/data/arena-tag";
import { CommonAnim } from "#app/data/battle-anims";
import { BattlerTagLapseType, CenterOfAttentionTag } from "#app/data/battler-tags";
import {
  AddArenaTrapTagAttr,
  allMoves,
  applyMoveAttrs,
  BypassRedirectAttr,
  BypassSleepAttr,
  CopyMoveAttr,
  DelayedAttackAttr,
  frenzyMissFunc,
  HealStatusEffectAttr,
  PreMoveMessageAttr,
  PreUseInterruptAttr,
} from "#app/data/moves/move";
import { MoveFlags } from "#enums/MoveFlags";
import { SpeciesFormChangePreMoveTrigger } from "#app/data/pokemon-forms";
import { getStatusEffectActivationText, getStatusEffectHealText } from "#app/data/status-effect";
import { PokemonType } from "#enums/pokemon-type";
import { getTerrainBlockMessage, getWeatherBlockMessage } from "#app/data/weather";
import { MoveUsedEvent } from "#app/events/battle-scene";
import type { PokemonMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { BattlePhase } from "#app/phases/battle-phase";
import { CommonAnimPhase } from "#app/phases/common-anim-phase";
import { MoveChargePhase } from "#app/phases/move-charge-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { NumberHolder } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { StatusEffect } from "#enums/status-effect";
import i18next from "i18next";
import { MoveUseType } from "#enums/move-use-type";

export class MovePhase extends BattlePhase {
  protected _pokemon: Pokemon;
  protected _move: PokemonMove;
  protected _targets: BattlerIndex[];
  protected _useType: MoveUseType;
  protected forcedLast: boolean;

  /** Whether the current move should fail but still use PP */
  protected failed = false;
  /** Whether the current move should cancel and retain PP */
  protected cancelled = false;

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

  public get useType(): MoveUseType {
    return this._useType;
  }

  protected set useType(useType: MoveUseType) {
    this._useType = useType;
  }

  public get targets(): BattlerIndex[] {
    return this._targets;
  }

  protected set targets(targets: BattlerIndex[]) {
    this._targets = targets;
  }

  /**
   * Create a new MovePhase for using moves.
   * @param pokemon - The {@linkcode Pokemon} using the move
   * @param move - The {@linkcode PokemonMove} to use
   * @param useType - The {@linkcode MoveUseType} corresponding to this move's means of execution (usually `MoveUseType.NORMAL`).
   * Not marked optional to ensure callers correctly pass on `useTypes`.
   * @param forcedLast - Whether to force this phase to occur last in order (for {@linkcode Moves.QUASH}); default `false`
   */
  constructor(pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, useType: MoveUseType, forcedLast = false) {
    super();

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.useType = useType;
    this.forcedLast = forcedLast;
  }

  /**
   * Checks if the pokemon is active, if the move is usable, and that the move is targeting something.
   * @param ignoreDisableTags `true` to not check if the move is disabled
   * @returns `true` if all the checks pass
   */
  public canMove(ignoreDisableTags = false): boolean {
    return (
      this.pokemon.isActive(true) &&
      this.move.isUsable(this.pokemon, this.useType >= MoveUseType.IGNORE_PP, ignoreDisableTags) &&
      this.targets.length > 0
    );
  }

  /** Signifies the current move should fail but still use PP */
  public fail(): void {
    this.failed = true;
  }

  /** Signifies the current move should cancel and retain PP */
  public cancel(): void {
    this.cancelled = true;
  }

  /**
   * Shows whether the current move has been forced to the end of the turn
   * Needed for speed order, see {@linkcode Moves.QUASH}
   */
  public isForcedLast(): boolean {
    return this.forcedLast;
  }

  public start(): void {
    super.start();

    console.log(Moves[this.move.moveId], MoveUseType[this.useType]);

    // Check if move is unusable (e.g. because it's out of PP due to a mid-turn Spite).
    if (!this.canMove(true)) {
      if (this.pokemon.isActive(true)) {
        this.fail();
        this.showMoveText();
        this.showFailedText();
      }
      this.end();
      return;
    }

    this.pokemon.turnData.acted = true;

    // Reset hit-related turn data when starting follow-up moves (e.g. Metronomed moves, Dancer repeats)
    if (this.useType >= MoveUseType.INDIRECT) {
      this.pokemon.turnData.hitsLeft = -1;
      this.pokemon.turnData.hitCount = 0;
    }

    // Check move to see if arena.ignoreAbilities should be true.
    if (
      this.move.getMove().doesFlagEffectApply({
        flag: MoveFlags.IGNORE_ABILITIES,
        user: this.pokemon,
        isFollowUp: this.useType >= MoveUseType.INDIRECT, // Sunsteel strike and co. don't work when called indirectly
      })
    ) {
      globalScene.arena.setIgnoreAbilities(true, this.pokemon.getBattlerIndex());
    }

    this.resolveRedirectTarget();

    this.resolveCounterAttackTarget();

    this.resolvePreMoveStatusEffects();

    this.lapsePreMoveAndMoveTags();

    if (!(this.failed || this.cancelled)) {
      this.resolveFinalPreMoveCancellationChecks();
    }

    // Cancel, charge or use the move as applicable.
    if (this.cancelled || this.failed) {
      this.handlePreMoveFailures();
    } else if (this.move.getMove().isChargingMove() && !this.pokemon.getTag(BattlerTagType.CHARGING)) {
      this.chargeMove();
    } else {
      this.useMove();
    }

    this.end();
  }

  /** Check for cancellation edge cases - no targets remaining, or {@linkcode Moves.NONE} is in the queue */
  protected resolveFinalPreMoveCancellationChecks(): void {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();

    if (
      (targets.length === 0 && !this.move.getMove().hasAttr(AddArenaTrapTagAttr)) ||
      (moveQueue.length > 0 && moveQueue[0].move === Moves.NONE)
    ) {
      this.showMoveText();
      this.showFailedText();
      this.cancel();
    }
  }

  public getActiveTargetPokemon(): Pokemon[] {
    return globalScene.getField(true).filter(p => this.targets.includes(p.getBattlerIndex()));
  }

  /**
   * Handles {@link StatusEffect.SLEEP | Sleep}/{@link StatusEffect.PARALYSIS | Paralysis}/{@link StatusEffect.FREEZE | Freeze} rolls and side effects.
   */
  protected resolvePreMoveStatusEffects(): void {
    // Skip for follow ups/reflected moves, no status condition or post turn statuses (e.g. Poison/Toxic)
    if (!this.pokemon.status || this.pokemon.status?.isPostTurn() || this.useType >= MoveUseType.FOLLOW_UP) {
      return;
    }

    if (
      this.useType === MoveUseType.INDIRECT &&
      [StatusEffect.SLEEP, StatusEffect.FREEZE].includes(this.pokemon.status.effect)
    ) {
      // Dancer thaws out or wakes up a frozen/sleeping user prior to use
      this.pokemon.resetStatus(false);
      return;
    }

    /** Whether to prevent us from using the move */
    let activated = false;
    /** Whether to cure the status */
    let healed = false;

    switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        activated =
          (!this.pokemon.randSeedInt(4) || Overrides.STATUS_ACTIVATION_OVERRIDE === true) &&
          Overrides.STATUS_ACTIVATION_OVERRIDE !== false;
        break;
      case StatusEffect.SLEEP: {
        applyMoveAttrs(BypassSleepAttr, this.pokemon, null, this.move.getMove());
        const turnsRemaining = new NumberHolder(this.pokemon.status.sleepTurnsRemaining ?? 0);
        applyAbAttrs(
          ReduceStatusEffectDurationAbAttr,
          this.pokemon,
          null,
          false,
          this.pokemon.status.effect,
          turnsRemaining,
        );
        this.pokemon.status.sleepTurnsRemaining = turnsRemaining.value;
        healed = this.pokemon.status.sleepTurnsRemaining <= 0;
        activated = !healed && !this.pokemon.getTag(BattlerTagType.BYPASS_SLEEP);
        break;
      }
      case StatusEffect.FREEZE:
        healed =
          !!this.move
            .getMove()
            .findAttr(
              attr => attr instanceof HealStatusEffectAttr && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE),
            ) ||
          (!this.pokemon.randSeedInt(5) && Overrides.STATUS_ACTIVATION_OVERRIDE !== true) ||
          Overrides.STATUS_ACTIVATION_OVERRIDE === false;

        activated = !healed;
        break;
    }

    if (activated) {
      // Cancel move activation and play effect
      this.cancel();
      globalScene.queueMessage(
        getStatusEffectActivationText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)),
      );
      globalScene.unshiftPhase(
        new CommonAnimPhase(
          this.pokemon.getBattlerIndex(),
          undefined,
          CommonAnim.POISON + (this.pokemon.status.effect - 1), // offset anim # by effect #
        ),
      );
    } else if (healed) {
      // cure status and play effect
      globalScene.queueMessage(
        getStatusEffectHealText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)),
      );
      this.pokemon.resetStatus();
      this.pokemon.updateInfo();
    }
  }

  /**
   * Lapse {@linkcode BattlerTagLapseType.PRE_MOVE  | PRE_MOVE} tags that trigger before a move is used, regardless of whether or not it failed.
   * Also lapse {@linkcode BattlerTagLapseType.MOVE | MOVE} tags if the move is successful and not called indirectly.
   */
  protected lapsePreMoveAndMoveTags(): void {
    this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

    // TODO: does this intentionally happen before the no targets/Moves.NONE on queue cancellation case is checked?
    // (In other words, check if truant can proc on a move w/o targets)
    if (this.useType < MoveUseType.FOLLOW_UP && this.canMove() && !this.cancelled) {
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
    }
  }

  protected useMove(): void {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();
    const move = this.move.getMove();

    // form changes happen even before we know that the move wll execute.
    globalScene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

    const isDelayedAttack = move.hasAttr(DelayedAttackAttr);
    if (isDelayedAttack) {
      // Check the player side arena if another delayed attack is active and hitting the same slot.
      const delayedAttackTags = globalScene.arena.findTags(t =>
        [ArenaTagType.FUTURE_SIGHT, ArenaTagType.DOOM_DESIRE].includes(t.tagType),
      ) as DelayedAttackTag[];
      const currentTargetIndex = targets[0].getBattlerIndex();

      if (delayedAttackTags.some(tag => tag.targetIndex === currentTargetIndex)) {
        this.showMoveText();
        this.failMove();
        return;
      }
    }

    // Check if the move has any attributes that can interrupt its own use **before** displaying text.
    let success = !move.getAttrs(PreUseInterruptAttr).some(attr => attr.apply(this.pokemon, targets[0], move));
    if (success) {
      this.showMoveText();
    }

    // Clear out any two turn moves once they've been used.
    // TODO: Refactor move queues and remove this assignment;
    // Move queues should be handled by the calling `CommandPhase` or a manager for it
    this.useType = moveQueue.shift()?.useType ?? this.useType;
    if (this.pokemon.getTag(BattlerTagType.CHARGING)?.sourceMove === this.move.moveId) {
      this.pokemon.lapseTag(BattlerTagType.CHARGING);
    }

    if (this.useType < MoveUseType.IGNORE_PP) {
      // "commit" to using the move, deducting PP.
      const ppUsed = 1 + this.getPpIncreaseFromPressure(targets);

      this.move.usePp(ppUsed);
      globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, move, this.move.ppUsed));
    }

    /**
     * Determine if the move is successful (meaning that its damage/effects can be attempted)
     * by checking that all of the following are true:
     * - Conditional attributes of the move are all met
     * - The target's `ForceSwitchOutImmunityAbAttr` is not triggered (see {@linkcode Move.prototype.applyConditions})
     * - Weather does not block the move
     * - Terrain does not block the move
     */

    /**
     * Move conditions assume the move has a single target
     * TODO: is this sustainable?
     */
    const passesConditions = move.applyConditions(this.pokemon, targets[0], move);
    const failedDueToWeather = globalScene.arena.isMoveWeatherCancelled(this.pokemon, move);
    const failedDueToTerrain = globalScene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, move);
    success &&= passesConditions && !failedDueToWeather && !failedDueToTerrain;

    if (!success) {
      this.failMove(failedDueToWeather, failedDueToTerrain);
      return;
    }

    if (!allMoves[this.move.moveId].hasAttr(CopyMoveAttr) && this.useType !== MoveUseType.INDIRECT) {
      // Update the battle's "last move" pointer unless we're currently mimicking a move or triggering Dancer.
      // TODO: Research how Copycat interacts with the final attacking turn of Future Sight and co.
      globalScene.currentBattle.lastMove = this.move.moveId;
    }

    // trigger ability-based user type changes and then execute move effects.
    applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, move);
    globalScene.unshiftPhase(new MoveEffectPhase(this.pokemon.getBattlerIndex(), this.targets, move, this.useType));

    // Handle Dancer, which triggers immediately after a move is used (rather than waiting on `this.end()`).
    // Note the MoveUseType check here prevents an infinite Dancer loop.
    if (
      this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) &&
      ![MoveUseType.INDIRECT, MoveUseType.REFLECTED].includes(this.useType)
    ) {
      // TODO: Fix in dancer PR to move to MEP for hit checks
      globalScene.getField(true).forEach(pokemon => {
        applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
      });
    }
  }

  /**
   * Fail the move currently being used.
   * Handles failure messages, pushing to move history, etc.
   * Notably, Roar, Whirlwind, Trick-or-Treat, and Forest's Curse will trigger type changes even on failure.
   * @param failedDueToWeather - Whether the move failed due to weather (default `false`)
   * @param failedDueToTerrain - Whether the move failed due to terrain (default `false`)
   */
  protected failMove(failedDueToWeather = false, failedDueToTerrain = false) {
    const move = this.move.getMove();
    const targets = this.getActiveTargetPokemon();

    if ([Moves.ROAR, Moves.WHIRLWIND, Moves.TRICK_OR_TREAT, Moves.FORESTS_CURSE].includes(this.move.moveId)) {
      applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, move);
    }

    this.pokemon.pushMoveHistory({
      move: this.move.moveId,
      targets: this.targets,
      result: MoveResult.FAIL,
      useType: this.useType,
    });

    // Use move-specific failure messages if present before checking terrain/weather blockage
    // and falling back to the classic "But it failed!".
    const failureMessage =
      move.getFailedText(this.pokemon, targets[0], move) ??
      (failedDueToTerrain
        ? getTerrainBlockMessage(targets[0], globalScene.arena.getTerrainType())
        : failedDueToWeather
          ? getWeatherBlockMessage(globalScene.arena.getWeatherType())
          : i18next.t("battle:attackFailed"));

    this.showFailedText(failureMessage);

    // Remove the user from its semi-invulnerable state (if applicable)
    this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
  }

  /**
   * Queue a {@linkcode MoveChargePhase} for this phase's invoked move.
   * Does NOT consume PP (occurs on the 2nd strike of the move)
   */
  protected chargeMove() {
    const move = this.move.getMove();
    const targets = this.getActiveTargetPokemon();

    this.showMoveText();

    // Conditions currently assume single target
    // TODO: Is this sustainable?
    if (!move.applyConditions(this.pokemon, targets[0], move)) {
      this.failMove();
      return;
    }

    // Protean and Libero apply on the charging turn of charge moves
    applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());

    globalScene.unshiftPhase(
      new MoveChargePhase(this.pokemon.getBattlerIndex(), this.targets[0], this.move, this.useType),
    );
  }

  /**
   * Queue a {@linkcode MoveEndPhase} and then end this phase.
   */
  public end(): void {
    globalScene.unshiftPhase(
      new MoveEndPhase(
        this.pokemon.getBattlerIndex(),
        this.getActiveTargetPokemon(),
        this.useType >= MoveUseType.INDIRECT,
      ),
    );

    super.end();
  }

  /**
   * Applies PP increasing abilities (currently only {@linkcode Abilities.PRESSURE | Pressure}) if they exist on the target pokemon.
   * Note that targets must include only active pokemon.
   *
   * TODO: This hardcodes the PP increase at 1 per opponent, rather than deferring to the ability.
   */
  public getPpIncreaseFromPressure(targets: Pokemon[]): number {
    const foesWithPressure = this.pokemon
      .getOpponents()
      .filter(o => targets.includes(o) && o.isActive(true) && o.hasAbilityWithAttr(IncreasePpAbAttr));
    return foesWithPressure.length;
  }

  /**
   * Modifies `this.targets` in place, based upon:
   * - Move redirection abilities, effects, etc.
   * - Counterattacks, which pass a special value into the `targets` constructor param (`[`{@linkcode BattlerIndex.ATTACKER}`]`).
   */
  protected resolveRedirectTarget(): void {
    if (this.targets.length === 1) {
      const currentTarget = this.targets[0];
      const redirectTarget = new NumberHolder(currentTarget);

      // check move redirection abilities of every pokemon *except* the user.
      globalScene
        .getField(true)
        .filter(p => p !== this.pokemon)
        .forEach(p => applyAbAttrs(RedirectMoveAbAttr, p, null, false, this.move.moveId, redirectTarget, this.pokemon));

      /** `true` if an Ability is responsible for redirecting the move to another target; `false` otherwise */
      let redirectedByAbility = currentTarget !== redirectTarget.value;

      // check for center-of-attention tags (note that this will override redirect abilities)
      this.pokemon.getOpponents().forEach(p => {
        const redirectTag = p.getTag(CenterOfAttentionTag);

        // TODO: don't hardcode this interaction.
        // Handle interaction between the rage powder center-of-attention tag and moves used by grass types/overcoat-havers (which are immune to RP's redirect)
        if (
          redirectTag &&
          (!redirectTag.powder ||
            (!this.pokemon.isOfType(PokemonType.GRASS) && !this.pokemon.hasAbility(Abilities.OVERCOAT)))
        ) {
          redirectTarget.value = p.getBattlerIndex();
          redirectedByAbility = false;
        }
      });

      if (currentTarget !== redirectTarget.value) {
        const bypassRedirectAttrs = this.move.getMove().getAttrs(BypassRedirectAttr);
        bypassRedirectAttrs.forEach(attr => {
          if (!attr.abilitiesOnly || redirectedByAbility) {
            redirectTarget.value = currentTarget;
          }
        });

        if (this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr)) {
          redirectTarget.value = currentTarget;
          // TODO: Ability displays should be handled by the ability
          globalScene.queueAbilityDisplay(
            this.pokemon,
            this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr),
            true,
          );
          globalScene.queueAbilityDisplay(
            this.pokemon,
            this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr),
            false,
          );
        }

        this.targets[0] = redirectTarget.value;
      }
    }
  }

  /**
   * Update the targets of any counter-attacking moves with `[`{@linkcode BattlerIndex.ATTACKER}`]` set
   * to reflect the actual battler index of the user's last attacker.
   *
   * If there is no last attacker or they are no longer on the field, a message is displayed and the
   * move is marked for failure.
   */
  protected resolveCounterAttackTarget(): void {
    if (this.targets.length !== 1 || this.targets[0] !== BattlerIndex.ATTACKER) {
      return;
    }

    if (this.pokemon.turnData.attacksReceived.length) {
      this.targets[0] = this.pokemon.turnData.attacksReceived[0].sourceBattlerIndex;

      // account for metal burst and comeuppance hitting remaining targets in double battles
      // counterattack will redirect to remaining ally if original attacker faints
      if (
        globalScene.currentBattle.double &&
        this.move.getMove().hasFlag(MoveFlags.REDIRECT_COUNTER) &&
        globalScene.getField()[this.targets[0]].hp === 0
      ) {
        const opposingField = this.pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
        this.targets[0] = opposingField.find(p => p.hp > 0)?.getBattlerIndex() ?? BattlerIndex.ATTACKER;
      }
    }

    if (this.targets[0] === BattlerIndex.ATTACKER) {
      this.fail();
      this.showMoveText();
      this.showFailedText();
    }
  }

  /**
   * Handles the case where the move was cancelled or failed:
   * - Uses PP if the move failed (not cancelled) and should use PP (failed moves are not affected by {@link Abilities.PRESSURE | Pressure})
   * - Records a cancelled OR failed move in move history, so abilities like {@link Abilities.TRUANT | Truant} don't trigger on the
   *   next turn and soft-lock.
   * - Lapses `MOVE_EFFECT` tags:
   *   - Semi-invulnerable battler tags (Fly/Dive/etc.) are intended to lapse on move effects, but also need
   *     to lapse on move failure/cancellation.
   *
   *     TODO: ...this seems weird.
   * - Lapses `AFTER_MOVE` tags:
   *   - This handles the effects of {@link Moves.SUBSTITUTE | Substitute}
   * - Removes the second turn of charge moves
   */
  protected handlePreMoveFailures(): void {
    if (!this.cancelled && !this.failed) {
      return;
    }

    if (this.failed) {
      const ppUsed = this.useType >= MoveUseType.IGNORE_PP ? 0 : 1;
      this.move.usePp(ppUsed);

      globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
    }

    if (this.cancelled && this.pokemon.summonData.tags?.find(t => t.tagType === BattlerTagType.FRENZY)) {
      frenzyMissFunc(this.pokemon, this.move.getMove());
    }

    this.pokemon.pushMoveHistory({
      move: Moves.NONE,
      result: MoveResult.FAIL,
      targets: this.targets,
      useType: this.useType,
    });

    this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
    this.pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);

    // This clears out 2 turn moves after they've been used
    // TODO: Remove post move queue refactor
    this.pokemon.getMoveQueue().shift();
  }

  /**
   * Displays the move's usage text to the player as applicable for the move being used.
   */
  public showMoveText(): void {
    // No text for Moves.NONE, recharging/2-turn moves or interrupted moves
    if (
      this.move.moveId === Moves.NONE ||
      this.pokemon.getTag(BattlerTagType.RECHARGING) ||
      this.pokemon.getTag(BattlerTagType.INTERRUPTED)
    ) {
      return;
    }

    // Play message for magic coat reflection
    // TODO: This should be done by the move...
    globalScene.queueMessage(
      i18next.t(this.useType === MoveUseType.REFLECTED ? "battle:magicCoatActivated" : "battle:useMove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
        moveName: this.move.getName(),
      }),
      500,
    );
    applyMoveAttrs(PreMoveMessageAttr, this.pokemon, this.pokemon.getOpponents(false)[0], this.move.getMove());
  }

  /**
   * Display the text for a move failing to execute.
   * @param failedText - The failure text to display; defaults to `"battle:attackFailed"` locale key
   * ("But it failed!" in english)
   */
  public showFailedText(failedText: string = i18next.t("battle:attackFailed")): void {
    globalScene.queueMessage(failedText);
  }
}
