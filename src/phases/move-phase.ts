import { BattlerIndex } from "#enums/battler-index";
import { globalScene } from "#app/global-scene";
import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import type { DelayedAttackTag } from "#app/data/arena-tag";
import { CommonAnim } from "#enums/move-anims-common";
import { CenterOfAttentionTag } from "#app/data/battler-tags";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { applyMoveAttrs } from "#app/data/moves/apply-attrs";
import { allMoves } from "#app/data/data-lists";
import { MoveFlags } from "#enums/MoveFlags";
import { SpeciesFormChangePreMoveTrigger } from "#app/data/pokemon-forms/form-change-triggers";
import { getStatusEffectActivationText, getStatusEffectHealText } from "#app/data/status-effect";
import { PokemonType } from "#enums/pokemon-type";
import { getTerrainBlockMessage, getWeatherBlockMessage } from "#app/data/weather";
import { MoveUsedEvent } from "#app/events/battle-scene";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#enums/move-result";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { BattlePhase } from "#app/phases/battle-phase";
import { enumValueToKey, NumberHolder } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { StatusEffect } from "#enums/status-effect";
import i18next from "i18next";
import { isVirtual, isIgnorePP, isReflected, MoveUseMode, isIgnoreStatus } from "#enums/move-use-mode";
import { frenzyMissFunc } from "#app/data/moves/move-utils";

export class MovePhase extends BattlePhase {
  public readonly phaseName = "MovePhase";
  protected _pokemon: Pokemon;
  protected _move: PokemonMove;
  protected _targets: BattlerIndex[];
  public readonly useMode: MoveUseMode; // Made public for quash
  protected forcedLast: boolean;

  /** Whether the current move should fail but still use PP */
  protected failed = false;
  /** Whether the current move should cancel and retain PP */
  protected cancelled = false;

  public get pokemon(): Pokemon {
    return this._pokemon;
  }

  // TODO: Do we need public getters but only protected setters?
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
   * Create a new MovePhase for using moves.
   * @param pokemon - The {@linkcode Pokemon} using the move
   * @param move - The {@linkcode PokemonMove} to use
   * @param useMode - The {@linkcode MoveUseMode} corresponding to this move's means of execution (usually `MoveUseMode.NORMAL`).
   * Not marked optional to ensure callers correctly pass on `useModes`.
   * @param forcedLast - Whether to force this phase to occur last in order (for {@linkcode MoveId.QUASH}); default `false`
   */
  constructor(pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, useMode: MoveUseMode, forcedLast = false) {
    super();

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.useMode = useMode;
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
      this.move.isUsable(this.pokemon, isIgnorePP(this.useMode), ignoreDisableTags) &&
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
   * Needed for speed order, see {@linkcode MoveId.QUASH}
   */
  public isForcedLast(): boolean {
    return this.forcedLast;
  }

  public start(): void {
    super.start();

    console.log(MoveId[this.move.moveId], enumValueToKey(MoveUseMode, this.useMode));

    // Check if move is unusable (e.g. running out of PP due to a mid-turn Spite
    // or the user no longer being on field), ending the phase early if not.
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
    if (isVirtual(this.useMode)) {
      this.pokemon.turnData.hitsLeft = -1;
      this.pokemon.turnData.hitCount = 0;
    }

    // Check move to see if arena.ignoreAbilities should be true.
    if (
      this.move.getMove().doesFlagEffectApply({
        flag: MoveFlags.IGNORE_ABILITIES,
        user: this.pokemon,
        isFollowUp: isVirtual(this.useMode), // Sunsteel strike and co. don't work when called indirectly
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

    if (this.cancelled || this.failed) {
      this.handlePreMoveFailures();
    } else if (this.move.getMove().isChargingMove() && !this.pokemon.getTag(BattlerTagType.CHARGING)) {
      this.chargeMove();
    } else {
      this.useMove();
    }

    this.end();
  }

  /** Check for cancellation edge cases - no targets remaining, or {@linkcode MoveId.NONE} is in the queue */
  protected resolveFinalPreMoveCancellationChecks(): void {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();

    if (
      (targets.length === 0 && !this.move.getMove().hasAttr("AddArenaTrapTagAttr")) ||
      (moveQueue.length > 0 && moveQueue[0].move === MoveId.NONE)
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
    if (!this.pokemon.status?.effect || this.pokemon.status.isPostTurn() || isIgnoreStatus(this.useMode)) {
      return;
    }

    if (
      this.useMode === MoveUseMode.INDIRECT &&
      [StatusEffect.SLEEP, StatusEffect.FREEZE].includes(this.pokemon.status.effect)
    ) {
      // Dancer thaws out or wakes up a frozen/sleeping user prior to use
      this.pokemon.resetStatus(false);
      return;
    }

    this.pokemon.status.incrementTurn();

    /** Whether to prevent us from using the move */
    let activated = false;
    /** Whether to cure the status */
    let healed = false;

    switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        activated =
          (this.pokemon.randBattleSeedInt(4) === 0 || Overrides.STATUS_ACTIVATION_OVERRIDE === true) &&
          Overrides.STATUS_ACTIVATION_OVERRIDE !== false;
        break;
      case StatusEffect.SLEEP: {
        applyMoveAttrs("BypassSleepAttr", this.pokemon, null, this.move.getMove());
        const turnsRemaining = new NumberHolder(this.pokemon.status.sleepTurnsRemaining ?? 0);
        applyAbAttrs("ReduceStatusEffectDurationAbAttr", {
          pokemon: this.pokemon,
          statusEffect: this.pokemon.status.effect,
          duration: turnsRemaining,
        });
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
              attr => attr.is("HealStatusEffectAttr") && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE),
            ) ||
          (!this.pokemon.randBattleSeedInt(5) && Overrides.STATUS_ACTIVATION_OVERRIDE !== true) ||
          Overrides.STATUS_ACTIVATION_OVERRIDE === false;

        activated = !healed;
        break;
    }

    if (activated) {
      // Cancel move activation and play effect
      this.cancel();
      globalScene.phaseManager.queueMessage(
        getStatusEffectActivationText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)),
      );
      globalScene.phaseManager.unshiftNew(
        "CommonAnimPhase",
        this.pokemon.getBattlerIndex(),
        undefined,
        CommonAnim.POISON + (this.pokemon.status.effect - 1), // offset anim # by effect #
      );
    } else if (healed) {
      // cure status and play effect
      globalScene.phaseManager.queueMessage(
        getStatusEffectHealText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)),
      );
      this.pokemon.resetStatus();
      this.pokemon.updateInfo();
    }
  }

  /**
   * Lapse {@linkcode BattlerTagLapseType.PRE_MOVE | PRE_MOVE} tags that trigger before a move is used, regardless of whether or not it failed.
   * Also lapse {@linkcode BattlerTagLapseType.MOVE | MOVE} tags if the move is successful and not called indirectly.
   */
  protected lapsePreMoveAndMoveTags(): void {
    this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

    // TODO: does this intentionally happen before the no targets/MoveId.NONE on queue cancellation case is checked?
    // (In other words, check if truant can proc on a move w/o targets)
    if (!isIgnoreStatus(this.useMode) && this.canMove() && !this.cancelled) {
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
    }
  }

  protected useMove(): void {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();
    const move = this.move.getMove();

    // form changes happen even before we know that the move wll execute.
    globalScene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

    const isDelayedAttack = move.hasAttr("DelayedAttackAttr");
    if (isDelayedAttack) {
      // Check the player side arena if future sight is active
      const futureSightTags = globalScene.arena.findTags(t => t.tagType === ArenaTagType.FUTURE_SIGHT);
      const doomDesireTags = globalScene.arena.findTags(t => t.tagType === ArenaTagType.DOOM_DESIRE);
      let fail = false;
      const currentTargetIndex = targets[0].getBattlerIndex();
      for (const tag of futureSightTags) {
        if ((tag as DelayedAttackTag).targetIndex === currentTargetIndex) {
          fail = true;
          break;
        }
      }
      for (const tag of doomDesireTags) {
        if ((tag as DelayedAttackTag).targetIndex === currentTargetIndex) {
          fail = true;
          break;
        }
      }
      if (fail) {
        this.showMoveText();
        this.showFailedText();
        this.end();
        return;
      }
    }

    let success = true;
    // Check if there are any attributes that can interrupt the move, overriding the fail message.
    for (const move of this.move.getMove().getAttrs("PreUseInterruptAttr")) {
      if (move.apply(this.pokemon, targets[0], this.move.getMove())) {
        success = false;
        break;
      }
    }

    if (success) {
      this.showMoveText();
    }

    // Clear out any two turn moves once they've been used.
    // TODO: Refactor move queues and remove this assignment;
    // Move queues should be handled by the calling `CommandPhase` or a manager for it
    // @ts-expect-error - useMode is readonly and shouldn't normally be assigned to
    this.useMode = moveQueue.shift()?.useMode ?? this.useMode;
    if (this.pokemon.getTag(BattlerTagType.CHARGING)?.sourceMove === this.move.moveId) {
      this.pokemon.lapseTag(BattlerTagType.CHARGING);
    }

    if (!isIgnorePP(this.useMode)) {
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
     *
     * TODO: These steps are straightforward, but the implementation below is extremely convoluted.
     */

    /**
     * Move conditions assume the move has a single target
     * TODO: is this sustainable?
     */
    let failedDueToTerrain = false;
    let failedDueToWeather = false;
    if (success) {
      const passesConditions = move.applyConditions(this.pokemon, targets[0], move);
      failedDueToWeather = globalScene.arena.isMoveWeatherCancelled(this.pokemon, move);
      failedDueToTerrain = globalScene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, move);
      success = passesConditions && !failedDueToWeather && !failedDueToTerrain;
    }

    // Update the battle's "last move" pointer, unless we're currently mimicking a move.
    if (!allMoves[this.move.moveId].hasAttr("CopyMoveAttr")) {
      // The last move used is unaffected by moves that fail
      if (success) {
        globalScene.currentBattle.lastMove = this.move.moveId;
      }
    }

    /**
     * If the move has not failed, trigger ability-based user type changes and then execute it.
     *
     * Notably, Roar, Whirlwind, Trick-or-Treat, and Forest's Curse will trigger these type changes even
     * if the move fails.
     */
    if (success) {
      const move = this.move.getMove();
      // TODO: Investigate whether PokemonTypeChangeAbAttr can drop the "opponent" parameter
      applyAbAttrs("PokemonTypeChangeAbAttr", { pokemon: this.pokemon, move, opponent: targets[0] });
      globalScene.phaseManager.unshiftNew(
        "MoveEffectPhase",
        this.pokemon.getBattlerIndex(),
        this.targets,
        move,
        this.useMode,
      );
    } else {
      if ([MoveId.ROAR, MoveId.WHIRLWIND, MoveId.TRICK_OR_TREAT, MoveId.FORESTS_CURSE].includes(this.move.moveId)) {
        applyAbAttrs("PokemonTypeChangeAbAttr", {
          pokemon: this.pokemon,
          move: this.move.getMove(),
          opponent: targets[0],
        });
      }

      this.pokemon.pushMoveHistory({
        move: this.move.moveId,
        targets: this.targets,
        result: MoveResult.FAIL,
        useMode: this.useMode,
      });

      const failureMessage = move.getFailedText(this.pokemon, targets[0], move);
      let failedText: string | undefined;
      if (failureMessage) {
        failedText = failureMessage;
      } else if (failedDueToTerrain) {
        failedText = getTerrainBlockMessage(targets[0], globalScene.arena.getTerrainType());
      } else if (failedDueToWeather) {
        failedText = getWeatherBlockMessage(globalScene.arena.getWeatherType());
      }

      this.showFailedText(failedText);

      // Remove the user from its semi-invulnerable state (if applicable)
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
    }

    // Handle Dancer, which triggers immediately after a move is used (rather than waiting on `this.end()`).
    // Note the MoveUseMode check here prevents an infinite Dancer loop.
    const dancerModes: MoveUseMode[] = [MoveUseMode.INDIRECT, MoveUseMode.REFLECTED] as const;
    if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !dancerModes.includes(this.useMode)) {
      // TODO: Fix in dancer PR to move to MEP for hit checks
      globalScene.getField(true).forEach(pokemon => {
        applyAbAttrs("PostMoveUsedAbAttr", { pokemon, move: this.move, source: this.pokemon, targets: this.targets });
      });
    }
  }

  /** Queues a {@linkcode MoveChargePhase} for this phase's invoked move. */
  protected chargeMove() {
    const move = this.move.getMove();
    const targets = this.getActiveTargetPokemon();

    this.showMoveText();

    // Conditions currently assume single target
    // TODO: Is this sustainable?
    if (!move.applyConditions(this.pokemon, targets[0], move)) {
      this.pokemon.pushMoveHistory({
        move: this.move.moveId,
        targets: this.targets,
        result: MoveResult.FAIL,
        useMode: this.useMode,
      });

      const failureMessage = move.getFailedText(this.pokemon, targets[0], move);
      this.showMoveText();
      this.showFailedText(failureMessage ?? undefined);

      // Remove the user from its semi-invulnerable state (if applicable)
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
      return;
    }

    // Protean and Libero apply on the charging turn of charge moves
    applyAbAttrs("PokemonTypeChangeAbAttr", {
      pokemon: this.pokemon,
      move: this.move.getMove(),
      opponent: targets[0],
    });

    globalScene.phaseManager.unshiftNew(
      "MoveChargePhase",
      this.pokemon.getBattlerIndex(),
      this.targets[0],
      this.move,
      this.useMode,
    );
  }

  /**
   * Queues a {@linkcode MoveEndPhase} and then ends the phase
   */
  public end(): void {
    globalScene.phaseManager.unshiftNew(
      "MoveEndPhase",
      this.pokemon.getBattlerIndex(),
      this.getActiveTargetPokemon(),
      isVirtual(this.useMode),
    );

    super.end();
  }

  /**
   * Applies PP increasing abilities (currently only {@link AbilityId.PRESSURE Pressure}) if they exist on the target pokemon.
   * Note that targets must include only active pokemon.
   *
   * TODO: This hardcodes the PP increase at 1 per opponent, rather than deferring to the ability.
   */
  public getPpIncreaseFromPressure(targets: Pokemon[]): number {
    const foesWithPressure = this.pokemon
      .getOpponents()
      .filter(o => targets.includes(o) && o.isActive(true) && o.hasAbilityWithAttr("IncreasePpAbAttr"));
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
        .forEach(p =>
          applyAbAttrs("RedirectMoveAbAttr", {
            pokemon: p,
            moveId: this.move.moveId,
            targetIndex: redirectTarget,
            sourcePokemon: this.pokemon,
          }),
        );

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
            (!this.pokemon.isOfType(PokemonType.GRASS) && !this.pokemon.hasAbility(AbilityId.OVERCOAT)))
        ) {
          redirectTarget.value = p.getBattlerIndex();
          redirectedByAbility = false;
        }
      });

      if (currentTarget !== redirectTarget.value) {
        const bypassRedirectAttrs = this.move.getMove().getAttrs("BypassRedirectAttr");
        bypassRedirectAttrs.forEach(attr => {
          if (!attr.abilitiesOnly || redirectedByAbility) {
            redirectTarget.value = currentTarget;
          }
        });

        if (this.pokemon.hasAbilityWithAttr("BlockRedirectAbAttr")) {
          redirectTarget.value = currentTarget;
          // TODO: Ability displays should be handled by the ability
          globalScene.phaseManager.queueAbilityDisplay(
            this.pokemon,
            this.pokemon.getPassiveAbility().hasAttr("BlockRedirectAbAttr"),
            true,
          );
          globalScene.phaseManager.queueAbilityDisplay(
            this.pokemon,
            this.pokemon.getPassiveAbility().hasAttr("BlockRedirectAbAttr"),
            false,
          );
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
  protected resolveCounterAttackTarget(): void {
    if (this.targets.length === 1 && this.targets[0] === BattlerIndex.ATTACKER) {
      if (this.pokemon.turnData.attacksReceived.length) {
        this.targets[0] = this.pokemon.turnData.attacksReceived[0].sourceBattlerIndex;

        // account for metal burst and comeuppance hitting remaining targets in double battles
        // counterattack will redirect to remaining ally if original attacker faints
        if (globalScene.currentBattle.double && this.move.getMove().hasFlag(MoveFlags.REDIRECT_COUNTER)) {
          if (globalScene.getField()[this.targets[0]].hp === 0) {
            const opposingField = this.pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
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
   * - Uses PP if the move failed (not cancelled) and should use PP (failed moves are not affected by {@link AbilityId.PRESSURE Pressure})
   * - Records a cancelled OR failed move in move history, so abilities like {@link AbilityId.TRUANT Truant} don't trigger on the
   *   next turn and soft-lock.
   * - Lapses `MOVE_EFFECT` tags:
   *   - Semi-invulnerable battler tags (Fly/Dive/etc.) are intended to lapse on move effects, but also need
   *     to lapse on move failure/cancellation.
   *
   *     TODO: ...this seems weird.
   * - Lapses `AFTER_MOVE` tags:
   *   - This handles the effects of {@link MoveId.SUBSTITUTE Substitute}
   * - Removes the second turn of charge moves
   */
  protected handlePreMoveFailures(): void {
    if (this.cancelled || this.failed) {
      if (this.failed) {
        const ppUsed = isIgnorePP(this.useMode) ? 0 : 1;

        if (ppUsed) {
          this.move.usePp();
        }

        globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
      }

      if (this.cancelled && this.pokemon.summonData.tags?.find(t => t.tagType === BattlerTagType.FRENZY)) {
        frenzyMissFunc(this.pokemon, this.move.getMove());
      }

      this.pokemon.pushMoveHistory({
        move: MoveId.NONE,
        result: MoveResult.FAIL,
        targets: this.targets,
        useMode: this.useMode,
      });

      this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
      this.pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);

      this.pokemon.getMoveQueue().shift();
    }
  }

  /**
   * Displays the move's usage text to the player, unless it's a charge turn (ie: {@link MoveId.SOLAR_BEAM Solar Beam}),
   * the pokemon is on a recharge turn (ie: {@link MoveId.HYPER_BEAM Hyper Beam}), or a 2-turn move was interrupted (ie: {@link MoveId.FLY Fly}).
   */
  public showMoveText(): void {
    if (this.move.moveId === MoveId.NONE) {
      return;
    }

    if (this.pokemon.getTag(BattlerTagType.RECHARGING) || this.pokemon.getTag(BattlerTagType.INTERRUPTED)) {
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t(isReflected(this.useMode) ? "battle:magicCoatActivated" : "battle:useMove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
        moveName: this.move.getName(),
      }),
      500,
    );

    // Moves with pre-use messages (Magnitude, Chilly Reception, Fickle Beam, etc.) always display their messages even on failure
    // TODO: This assumes single target for message funcs - is this sustainable?
    applyMoveAttrs("PreMoveMessageAttr", this.pokemon, this.pokemon.getOpponents(false)[0], this.move.getMove());
  }

  public showFailedText(failedText: string = i18next.t("battle:attackFailed")): void {
    globalScene.phaseManager.queueMessage(failedText);
  }
}
