// biome-ignore-start lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { Move, PreUseInterruptAttr } from "#types/move-types";

// biome-ignore-end lint/correctness/noUnusedImports: Used in a tsdoc comment

import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { MOVE_COLOR } from "#app/constants/colors";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { CenterOfAttentionTag } from "#data/battler-tags";
import { SpeciesFormChangePreMoveTrigger } from "#data/form-change-triggers";
import { getStatusEffectActivationText } from "#data/status-effect";
import { getTerrainBlockMessage } from "#data/terrain";
import { getWeatherBlockMessage } from "#data/weather";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { ChallengeType } from "#enums/challenge-type";
import { CommonAnim } from "#enums/move-anims-common";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import { MoveResult } from "#enums/move-result";
import { isIgnorePP, isIgnoreStatus, isReflected, isVirtual, MoveUseMode } from "#enums/move-use-mode";
import { PokemonType } from "#enums/pokemon-type";
import { StatusEffect } from "#enums/status-effect";
import { MoveUsedEvent } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import { applyMoveAttrs } from "#moves/apply-attrs";
import { frenzyMissFunc } from "#moves/move-utils";
import type { PokemonMove } from "#moves/pokemon-move";
import type { TurnMove } from "#types/turn-move";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder, NumberHolder } from "#utils/common";
import { enumValueToKey } from "#utils/enums";
import i18next from "i18next";

export class MovePhase extends PokemonPhase {
  public readonly phaseName = "MovePhase";
  protected _pokemon: Pokemon;
  public move: PokemonMove;
  protected _targets: BattlerIndex[];
  public readonly useMode: MoveUseMode; // Made public for quash
  /** The timing modifier of the move (used by Quash and to force called moves to the front of their queue) */
  public timingModifier: MovePhaseTimingModifier;
  /** Whether the current move should fail but still use PP. */
  protected failed = false;
  /** Whether the current move should fail and retain PP. */
  protected cancelled = false;

  /** Flag set to `true` during {@linkcode checkFreeze} that indicates that the pokemon will thaw if it passes the failure conditions */
  private declare thaw?: boolean;

  /** The move history entry object that is pushed to the pokemon's move history
   *
   * @remarks
   * Can be edited _after_ being pushed to the history to adjust the result, targets, etc, for this move phase.
   */
  protected readonly moveHistoryEntry: TurnMove;

  public get pokemon(): Pokemon {
    return this._pokemon;
  }

  // TODO: Do we need public getters but only protected setters?
  protected set pokemon(pokemon: Pokemon) {
    this._pokemon = pokemon;
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
   * @param timingModifier - The {@linkcode MovePhaseTimingModifier} for the move; Default {@linkcode MovePhaseTimingModifier.NORMAL}
   */
  constructor(
    pokemon: Pokemon,
    targets: BattlerIndex[],
    move: PokemonMove,
    useMode: MoveUseMode,
    timingModifier: MovePhaseTimingModifier = MovePhaseTimingModifier.NORMAL,
  ) {
    super(pokemon.getBattlerIndex());

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.useMode = useMode;
    this.timingModifier = timingModifier;
    this.moveHistoryEntry = {
      move: MoveId.NONE,
      targets,
      useMode,
    };
  }

  public start(): void {
    super.start();

    const user = this.pokemon;

    // Fallback - end phase early if the user is removed from the field or faints
    // before using a move.
    // TODO: Cancel the user's queued `MovePhase`s when they leave the field -
    // force switching a pokemon out and back in should not let them use a move
    if (!user.isActive(true)) {
      this.end();
      return;
    }

    const useMode = this.useMode;
    const ignoreStatus = isIgnoreStatus(useMode);
    const isFollowUp = useMode === MoveUseMode.FOLLOW_UP;

    console.log(
      // biome-ignore lint/complexity/noUselessStringConcat: biome doesn't recognize leading pluses
      `%cUser: ${user.name}`
        + `\nMove: ${MoveId[this.move.moveId]}`
        + `\nUse Mode: ${enumValueToKey(MoveUseMode, this.useMode)}`,
      `color:${MOVE_COLOR}`,
    );

    // Removing Glaive Rush's two flags happens before **everything** else
    user.removeTag(BattlerTagType.ALWAYS_GET_HIT);
    user.removeTag(BattlerTagType.RECEIVE_DOUBLE_DAMAGE);

    // For the purposes of payback and kin, the pokemon is considered to have acted
    // if it attempted to move at all.
    user.turnData.acted = true;

    if (!ignoreStatus) {
      this.firstFailureCheck();
      user.lapseTags(BattlerTagLapseType.PRE_MOVE);

      // TODO: Rework move-calling-moves to change the currently queued move and perform validation here
      // once the concept of a "move-in-flight" is established
      // For now, this comment works as a placeholder until called moves are reworked
      // For correct alignment with mainline, this SHOULD go here, and this phase SHOULD rewrite its own move
    } else if (isFollowUp) {
      // Follow up moves check a subset of conditions
      // TODO: See above
      this.followUpMoveFirstFailureCheck();
    }

    // If the first failure check did not pass, then the move is cancelled
    // Note: This only checks `cancelled`, as `failed` should NEVER be set by anything in the above block
    if (this.cancelled) {
      this.handlePreMoveFailures();
      this.end();
      return;
    }

    // Thaw the user if it used a self-thawing move
    this.doThawCheck();

    // Reset hit-related turn data when starting follow-up moves (e.g. Metronomed moves, Dancer repeats)
    // TODO: Apply this to the current "move in flight" object and remove the equivalent calls from MEP
    if (isVirtual(useMode)) {
      const turnData = user.turnData;
      turnData.hitsLeft = -1;
      turnData.hitCount = 0;
    }

    const pokemonMove = this.move;
    const move = pokemonMove.getMove();

    // Toggle ability-ignoring effects for the duration of the move, if the user and move permit.
    if (
      move.doesFlagEffectApply({
        flag: MoveFlags.IGNORE_ABILITIES,
        user,
        isFollowUp: isVirtual(useMode), // Sunsteel strike and co. don't ignore abilities when called indirectly
      })
    ) {
      globalScene.arena.setIgnoreAbilities(true, user.getBattlerIndex());
    }

    // TODO: Apply move type changes and multi-target effects here
    // Pokerogue's current implementation applies these effects during the move effect phase
    // as there is not (yet) a notion of a move-in-flight for determinations to occur

    // Compute targets from redirection and counterattacks
    this.resolveRedirectTarget();
    this.resolveCounterAttackTarget();

    // Update the battle's "last move" pointer unless we're currently mimicking a move or triggering Dancer.
    // TODO: This should presumably be after the 2nd set of failure checks
    if (!move.hasAttr("CopyMoveAttr") && !isReflected(useMode)) {
      globalScene.currentBattle.lastMove = move.id;
    }

    const isChargingMove = move.isChargingMove();
    /** Indicates this is the charging turn of the move */
    const charging = isChargingMove && !user.getTag(BattlerTagType.CHARGING);

    // Charging moves consume PP when they begin charging, *not* when they release
    // TODO: We may not need the `!user.getTag` check if charging moves pass `ignorePP` for use mode
    if (!isChargingMove || charging) {
      this.usePP();
    }

    // Stance Change does not trigger on called moves
    if (!isFollowUp) {
      globalScene.triggerPokemonFormChange(user, SpeciesFormChangePreMoveTrigger);
      // TODO: apply gorilla tactics lock-in here instead of in the move effect phase
    }

    this.showMoveText();

    if (this.secondFailureCheck()) {
      this.handlePreMoveFailures();
      this.end();
      return;
    }

    if (!this.resolveFinalPreMoveCancellationChecks()) {
      this.useMove(charging);
    }

    this.end();
  }

  //#region First Failure Check

  /**
   * Perform the first round of move failure checks, occurring before move usage text is displayed
   * and PP is deducted.
   * @returns Whether the move failed during the check
   * @remarks
   * Based on battle mechanics research conducted primarily by Smogon, checks happen in the following order (as of Gen 9):
   * 1. Sleep/Freeze
   * 2. Disobedience due to overleveled (not implemented in Pokerogue)
   * 3. Insufficient PP after being selected
   * 4. (Pokerogue specific) Moves disabled because they are not implemented / prevented from a challenge / somehow have no targets
   * 5. Sky battle (see {@linkcode https://github.com/pagefaultgames/pokerogue/pull/5983 | PR#5983})
   * 6. Truant
   * 7. Focus Punch's loss of focus
   * 8. Flinch
   * 9. Move was disabled after being selected
   * 10. Healing move with heal block
   * 11. Sound move with throat chop
   * 12. Failure due to gravity
   * 13. Move lock from choice items / gorilla tactics
   * 14. Failure from taunt
   * 15. Failure from imprison
   * 16. Failure from confusion
   * 17. Failure from paralysis
   * 18. Failure from infatuation
   */
  protected firstFailureCheck(): boolean {
    return (
      this.checkSleep()
      || this.checkFreeze()
      || this.checkPP()
      || this.checkValidity()
      || this.checkTagCancel(BattlerTagType.TRUANT)
      || this.checkPreUseInterrupt()
      || this.checkTagCancel(BattlerTagType.FLINCHED)
      || this.checkTagCancel(BattlerTagType.DISABLED)
      || this.checkTagCancel(BattlerTagType.HEAL_BLOCK)
      || this.checkTagCancel(BattlerTagType.THROAT_CHOPPED)
      || this.checkGravity()
      || this.checkTagCancel(BattlerTagType.TAUNT)
      || this.checkTagCancel(BattlerTagType.IMPRISON)
      || this.checkTagCancel(BattlerTagType.CONFUSED)
      || this.checkPara()
      || this.checkTagCancel(BattlerTagType.INFATUATED)
    );
  }

  /**
   * Perform a subset of the checks done in {@linkcode firstFailureCheck}
   * for called moves.
   * @returns Whether the called move should fail
   *
   * @remarks
   * Based on smogon battle mechanics research, checks happen in the following order:
   * 1. Invalid move (skipped in pokerogue)
   * 2. Move prevented by heal block
   * 3. Move prevented by throat chop
   * 4. Gravity
   * 5. Sky Battle (See {@link https://github.com/pagefaultgames/pokerogue/pull/5983 | PR#5983})
   */
  protected followUpMoveFirstFailureCheck(): boolean {
    return (
      this.checkTagCancel(BattlerTagType.HEAL_BLOCK)
      || this.checkTagCancel(BattlerTagType.THROAT_CHOPPED)
      || this.checkGravity()
    );
  }

  /**
   * Handle checking and activating the user's Sleep status condition.
   * @returns Whether the move was cancelled due to the user being asleep.
   * Returns `false` if `user` is not asleep or wakes up mid-move
   */
  protected checkSleep(): boolean {
    const user = this.pokemon;
    if (user.status?.effect !== StatusEffect.SLEEP) {
      return false;
    }

    // Dancer will immediately wake its user from sleep when triggering
    if (this.useMode === MoveUseMode.INDIRECT) {
      user.cureStatus(StatusEffect.SLEEP);
      return false;
    }

    // TODO: Move Early Bird check into `incrementTurn`
    user.status.incrementTurn();
    const turnsRemaining = new NumberHolder(user.status.sleepTurnsRemaining ?? 0);
    applyAbAttrs("ReduceStatusEffectDurationAbAttr", {
      pokemon: user,
      statusEffect: user.status.effect,
      duration: turnsRemaining,
    });
    user.status.sleepTurnsRemaining = turnsRemaining.value;

    if (user.status.sleepTurnsRemaining <= 0) {
      user.cureStatus(StatusEffect.SLEEP);
      return false;
    }

    // Check for sleep bypassing moves
    const bypassSleepHolder = new BooleanHolder(false);
    applyMoveAttrs("BypassSleepAttr", this.pokemon, null, this.move.getMove(), bypassSleepHolder);
    const cancel = !bypassSleepHolder.value;
    this.triggerStatus(StatusEffect.SLEEP, cancel);
    return cancel;
  }

  /**
   * Handle checking and activating the user's Freeze status condition.
   * @returns Whether the move was cancelled due to the user freezing solid.
   * Returns `false` if the user is not frozen or thaws out mid-move.
   * @remarks
   * Moves that thaw the user out will not cure the status until after all other failure checks
   * in the 1st failure block have passed.
   */
  protected checkFreeze(): boolean {
    const user = this.pokemon;
    if (user.status?.effect !== StatusEffect.FREEZE) {
      return false;
    }

    // Dancer will immediately thaw its user upon activation
    if (this.useMode === MoveUseMode.INDIRECT) {
      user.cureStatus(StatusEffect.FREEZE);
      return false;
    }

    // If using a self-thaw move, set this.thaw to true and circle back later
    if (
      this.move
        .getMove()
        .findAttr(attr => attr.selfTarget && attr.is("HealStatusEffectAttr") && attr.isOfEffect(StatusEffect.FREEZE))
    ) {
      this.thaw = true;
      return false;
    }

    // Perform a 20% random roll, subject to overrides
    const randomThaw =
      Overrides.STATUS_ACTIVATION_OVERRIDE !== null
        ? !Overrides.STATUS_ACTIVATION_OVERRIDE
        : user.randBattleSeedInt(5) === 0;
    if (randomThaw) {
      user.cureStatus(StatusEffect.FREEZE);
      return false;
    }

    this.triggerStatus(StatusEffect.FREEZE);
    return true;
  }

  /**
   * Check if the move is usable based on PP remaining.
   * @returns Whether the move was cancelled due to insufficient PP
   */
  protected checkPP(): boolean {
    const move = this.move;
    if (isIgnorePP(this.useMode) || !move.isOutOfPp()) {
      return false;
    }

    this.cancel();
    this.showFailedText();
    return true;
  }

  /**
   * Check if the move is valid and not in an error state
   * @returns Whether the move was cancelled due to being invalid
   * @remarks
   * Checks occur in the following order:
   * 1. Move is not implemented
   * 2. Move is somehow invalid (it is {@linkcode MoveId.NONE} or {@linkcode targets} is somehow empty)
   * 3. Move cannot be used by the player due to a challenge
   */
  protected checkValidity(): boolean {
    const move = this.move;
    const moveId = move.moveId;
    const moveName = move.getName();
    let failedText: string | undefined;

    if (moveName.endsWith(" (N)")) {
      failedText = i18next.t("battle:moveNotImplemented", { moveName: moveName.replace(" (N)", "") });
    } else if (moveId === MoveId.NONE || this.targets.length === 0) {
      this.cancel();

      // TODO: Do we want to log a message here?
      const pokemonName = this.pokemon.name;
      const warningText =
        moveId === MoveId.NONE
          ? `${pokemonName} is attempting to use MoveId.NONE`
          : `${pokemonName} is attempting to use a move with no targets`;

      console.warn(warningText);

      return true;
    } else if (this.isChallengeInvalid()) {
      failedText = i18next.t("battle:moveCannotUseChallenge", { moveName });
    }

    if (!failedText) {
      return false;
    }

    this.cancel();
    this.showFailedText(failedText);
    return true;
  }

  /**
   * Sub-method to {@linkcode checkValidity} that handles checking challenge restrictions.
   * @returns Whether the move is barred due to a challenge
   */
  private isChallengeInvalid(): boolean {
    const user = this.pokemon;
    if (!user.isPlayer()) {
      return false;
    }
    const usability = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_MOVE, this.move.moveId, usability);
    return !usability.value;
  }

  /**
   * Trigger a specific `BattlerTag` to conditionally cancel move execution.
   * Used by the first failure check to trigger certain kinds of interruptions before others.
   * @param tagType - The `BattlerTagType` to trigger; will be lapsed with `BattlerTagLapseType.PRE_MOVE`
   * @returns Whether the move was cancelled due to activating `tagType`
   */
  private checkTagCancel(tagType: BattlerTagType): boolean {
    this.pokemon.lapseTag(tagType, BattlerTagLapseType.PRE_MOVE);
    return this.cancelled;
  }

  /**
   * Check cancellations from a move's pre-use condition.
   * @returns Whether the move was cancelled due to a pre-use condition.
   * @remarks
   * Currently only used for Focus Punch.
   * @see {@linkcode PreUseInterruptAttr}
   */
  private checkPreUseInterrupt(): boolean {
    const move = this.move.getMove();
    const user = this.pokemon;
    const target = this.getActiveTargetPokemon()[0];
    return move.getAttrs("PreUseInterruptAttr").some(attr => {
      attr.apply(user, target, move);
      return this.cancelled;
    });
  }

  /**
   * Handle move failures due to Gravity.
   * @returns Whether the move was cancelled due to Gravity
   */
  private checkGravity(): boolean {
    const move = this.move.getMove();
    if (!globalScene.arena.hasTag(ArenaTagType.GRAVITY) || !move.hasFlag(MoveFlags.GRAVITY)) {
      return false;
    }

    this.showFailedText(
      i18next.t("battle:moveDisabledGravity", {
        pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
        moveName: move.name,
      }),
    );
    return true;
  }

  /**
   * Handle checking and activating the user's Paralysis status condition.
   * @returns Whether the move was cancelled due to the user being fully paralyzed.
   * Returns `false` if `user` is not paralyzed
   */
  private checkPara(): boolean {
    const user = this.pokemon;
    if (user.status?.effect !== StatusEffect.PARALYSIS) {
      return false;
    }

    const proc = Overrides.STATUS_ACTIVATION_OVERRIDE ?? user.randBattleSeedInt(4) === 0;
    if (!proc) {
      return false;
    }

    this.triggerStatus(StatusEffect.PARALYSIS);
    return true;
  }

  //#endregion First Failure Check

  //#region Second Failure Check

  /**
   * Attempt to thaw the user if it successfully uses a self-thawing move.
   */
  private doThawCheck(): void {
    if (isIgnoreStatus(this.useMode) || !this.thaw) {
      return;
    }

    const user = this.pokemon;
    user.cureStatus(
      StatusEffect.FREEZE,
      i18next.t("statusEffect:freeze.healByMove", {
        pokemonName: getPokemonNameWithAffix(user),
        moveName: this.move.getMove().name,
      }),
    );
  }

  /**
   * Modify `this.targets` in place based on move redirection effects.
   */
  protected resolveRedirectTarget(): void {
    if (this.targets.length !== 1) {
      // Spread moves cannot be redirected
      return;
    }

    const currentTarget = this.targets[0];
    const redirectTarget = new NumberHolder(currentTarget);

    // check move redirection abilities of every pokemon *except* the user.
    // TODO: Make storm drain, lightning rod, etc, redirect at this point for type changing moves
    globalScene
      .getField(true)
      .filter(p => p !== this.pokemon)
      .forEach(pokemon => {
        applyAbAttrs("RedirectMoveAbAttr", {
          pokemon,
          moveId: this.move.moveId,
          targetIndex: redirectTarget,
          sourcePokemon: this.pokemon,
        });
      });

    /** `true` if an Ability is responsible for redirecting the move to another target; `false` otherwise */
    let redirectedByAbility = currentTarget !== redirectTarget.value;

    // check for center-of-attention tags (note that this will override redirect abilities)
    this.pokemon.getOpponents(true).forEach(p => {
      const redirectTag = p.getTag(CenterOfAttentionTag);

      // TODO: don't hardcode this interaction.
      // Handle interaction between the rage powder center-of-attention tag and moves used by grass types/overcoat-havers (which are immune to RP's redirect)
      if (
        redirectTag
        && (!redirectTag.powder
          || (!this.pokemon.isOfType(PokemonType.GRASS) && !this.pokemon.hasAbility(AbilityId.OVERCOAT)))
      ) {
        redirectTarget.value = p.getBattlerIndex();
        redirectedByAbility = false;
      }
    });

    // TODO: Don't hardcode these ability interactions
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

  /**
   * Update the targets of any counter-attacking moves with `[`{@linkcode BattlerIndex.ATTACKER}`]` set
   * to reflect the actual battler index of the user's last attacker.
   *
   * If there is no last attacker or they are no longer on the field, a message is displayed and the
   * move is marked for failure
   */
  // TODO: Decouple this from `BattlerIndex.ATTACKER` altogether
  protected resolveCounterAttackTarget(): void {
    const targets = this.targets;
    if (targets.length !== 1 || targets[0] !== BattlerIndex.ATTACKER) {
      return;
    }

    const targetHolder = new NumberHolder(BattlerIndex.ATTACKER);

    applyMoveAttrs("CounterRedirectAttr", this.pokemon, null, this.move.getMove(), targetHolder);
    targets[0] = targetHolder.value;
    if (targetHolder.value === BattlerIndex.ATTACKER) {
      this.fail();
    }
  }

  /**
   * Deduct PP from the move being used, accounting for Pressure and other effects.
   */
  protected usePP(): void {
    if (isIgnorePP(this.useMode)) {
      return;
    }

    const move = this.move;
    const ppUsed = 1 + this.getPpIncreaseFromPressure(this.getActiveTargetPokemon());
    move.usePp(ppUsed);
    globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon.id, move.getMove(), move.ppUsed));
  }

  /**
   * Apply PP increasing abilities (currently only {@linkcode AbilityId.PRESSURE | Pressure})
   * on all target Pokemon.
   * @param targets - An array containing all active Pokemon targeted by this Phase's move
   * @returns The amount of extra PP consumed due to Pressure
   */
  // TODO: This hardcodes the PP increase at 1 per opponent, rather than deferring to the ability.
  // This is likely due to said ability being a stub...
  private getPpIncreaseFromPressure(targets: Pokemon[]): number {
    const foesWithPressure = this.pokemon
      .getOpponents(true)
      .filter(opponent => targets.includes(opponent) && opponent.hasAbilityWithAttr("IncreasePpAbAttr"));
    return foesWithPressure.length;
  }

  /**
   * Display the move usage text for the move being used.
   */
  private showMoveText(): void {
    const pokemonMove = this.move;
    const moveId = pokemonMove.moveId;
    const pokemon = this.pokemon;
    if (
      moveId === MoveId.NONE
      || pokemon.getTag(BattlerTagType.RECHARGING)
      || pokemon.getTag(BattlerTagType.INTERRUPTED)
    ) {
      return;
    }
    // Showing move text always adjusts the move history entry's move id
    this.moveHistoryEntry.move = moveId;

    // TODO: This should be done by the move...
    globalScene.phaseManager.queueMessage(
      i18next.t(isReflected(this.useMode) ? "battle:magicCoatActivated" : "battle:useMove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: pokemonMove.getName(),
      }),
      500,
    );

    // Moves with pre-use messages (Magnitude, Chilly Reception, Fickle Beam, etc.) always display their messages even on failure
    // TODO: This assumes single target for message funcs - is this sustainable?
    applyMoveAttrs("PreMoveMessageAttr", pokemon, this.getActiveTargetPokemon()[0], pokemonMove.getMove());
  }

  /**
   * Perform the second round of move failure checks, occurring after move usage text has been shown
   * and PP has been deducted, but BEFORE the move has been registered
   * as being the last move used.
   * @returns Whether the move failed during this check
   * @remarks
   * This checks the following effects:
   * - Everything in {@linkcode Move.conditionsSeq2}
   * - Failure due to primal weather
   * - (on cart, not applicable to Pokerogue) Moves that fail if used ON a raid / special boss: selfdestruct/explosion/imprision/power split / guard split
   * - (on cart, not applicable to Pokerogue) Moves that fail during a "co-op" battle (like when Arven helps during raid boss): ally switch / teatime
   * - Powder causing the user to explode (happens last)
   */
  protected secondFailureCheck(): boolean {
    const move = this.move.getMove();
    const user = this.pokemon;
    let failedText: string | undefined;
    const arena = globalScene.arena;

    if (!move.applyConditions(user, this.getActiveTargetPokemon()[0], 2)) {
      // TODO: Make pollen puff failing from heal block use its own message
      this.failed = true;
    } else if (arena.isMoveWeatherCancelled(user, move)) {
      failedText = getWeatherBlockMessage(globalScene.arena.getWeatherType());
      this.failed = true;
    } else {
      // Powder *always* happens last
      // Note: Powder's lapse method handles everything: messages, damage, animation, primal weather interaction,
      // determining type of type changing moves, etc.
      // It will set this phase's `failed` flag to true if it procs
      user.lapseTag(BattlerTagType.POWDER, BattlerTagLapseType.PRE_MOVE);
      return this.failed;
    }

    if (this.failed) {
      this.showFailedText(failedText);
      return true;
    }
    return false;
  }

  //#endregion Second Failure Check

  //#region Move Execution

  /**
   * Check for cancellation edge cases - no targets remaining, or `MoveId.NONE` is in the queue
   * @returns Whether the move failed due to an edge case
   */
  // TODO: The first part of this check seems already covered in `checkValidity`...
  protected resolveFinalPreMoveCancellationChecks(): boolean {
    const targets = this.getActiveTargetPokemon();
    const moveQueue = this.pokemon.getMoveQueue();

    if (
      (targets.length === 0 && !this.move.getMove().hasAttr("AddArenaTrapTagAttr"))
      || (moveQueue.length > 0 && moveQueue[0].move === MoveId.NONE)
    ) {
      this.showFailedText();
      this.fail();
      this.pokemon.pushMoveHistory(this.moveHistoryEntry);
      return true;
    }
    this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
    return false;
  }

  /**
   * Clear out two turn moves, then schedule the move to be used if it passes
   * the third failure check.
   */
  protected useMove(charging = false): void {
    const user = this.pokemon;

    /* Clear out any two turn moves once they've been used.
    TODO: Refactor move queues and remove this assignment;
    Move queues should be handled by the calling `CommandPhase` or a manager for it */

    // @ts-expect-error - useMode is readonly and shouldn't normally be assigned to
    this.useMode = user.getMoveQueue().shift()?.useMode ?? this.useMode;

    if (!charging && user.getTag(BattlerTagType.CHARGING)?.sourceMove === this.move.moveId) {
      user.lapseTag(BattlerTagType.CHARGING);
    }

    if (this.thirdFailureCheck()) {
      return;
    }

    /*
    At this point, delayed moves (future sight, wish, doom desire) are issued, and, if they occur, the move animations are played.
    Then, combined pledge moves are checked for. Interestingly, the "wasMoveEffective" flag is set to false if the combined technique
    In either case, the phase should end here without proceeding
    */

    const move = this.move.getMove();
    const opponent = this.getActiveTargetPokemon()[0];

    /*
    After the third failure check, the move is "locked in"
    The following things now occur on cartridge
    - Heal Bell / Aromatherapy's custom message is queued (but displayed after the move text)
    - The message for combined pledge moves is queued
    - The custom message for fickle beam is queued
    - Gulp missile's form change is triggered IF the user is using dive (surf happens later)
    - Protean / Libero trigger the type change and flyout
    */

    // Currently, we only do the libero/protean type change here

    applyAbAttrs("PokemonTypeChangeAbAttr", { pokemon: user, move, opponent });

    // TODO: Move this to the Move effect phase where it belongs.
    // Fourth failure check happens _after_ protean
    if (!move.applyConditions(user, opponent, 4)) {
      this.failMove();
      return;
    }

    if (charging) {
      this.chargeMove();
    } else {
      this.executeMove();
    }
  }

  /**
   * Perform the third round of move failure checks, occurring after move usage text has been displayed
   * and PP deducted.
   * @returns Whether the move failed
   *
   * @remarks
   * This performs the following checks:
   * - Everything in {@linkcode Move.conditionsSeq3}
   *   - Includes Damp (which is handled by move conditions in PKR)
   * - Weather blocking the move
   * - Terrain blocking the move
   * - Queenly Majesty / Dazzling
   */
  protected thirdFailureCheck(): boolean {
    /**
     * Move conditions assume the move has a single target
     * TODO: is this sustainable?
     */
    const move = this.move.getMove();
    const targets = this.getActiveTargetPokemon();
    const arena = globalScene.arena;
    const user = this.pokemon;

    const failsConditions = !move.applyConditions(user, targets[0], 3);
    const failedDueToTerrain = arena.isMoveTerrainCancelled(user, this.targets, move);
    let failed = failsConditions || failedDueToTerrain;

    // Apply queenly majesty / dazzling
    if (!failed) {
      const defendingSidePlayField = user.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
      const cancelled = new BooleanHolder(false);
      defendingSidePlayField.forEach((pokemon: Pokemon) => {
        applyAbAttrs("FieldPriorityMoveImmunityAbAttr", {
          pokemon,
          opponent: user,
          move,
          cancelled,
        });
      });
      failed = cancelled.value;
    }

    if (failed) {
      this.failMove(failedDueToTerrain);
      return true;
    }

    return false;
  }

  /** Execute the current move and apply its effects. */
  private executeMove(): void{
    const user = this.pokemon;
    const move = this.move.getMove();
    const targets = this.targets;

    // Trigger ability-based user type changes, display move text and then execute move effects.
    // TODO: Investigate whether PokemonTypeChangeAbAttr can drop the "opponent" parameter

    globalScene.phaseManager.unshiftNew("MoveEffectPhase", user.getBattlerIndex(), targets, move, this.useMode);

    // Handle Dancer, which triggers immediately after a move is used (rather than waiting on `this.end()`).
    // Note the MoveUseMode check here prevents an infinite Dancer loop.
    // TODO: This needs to go at the end of `MoveEffectPhase` to check move results
    const dancerModes: MoveUseMode[] = [MoveUseMode.INDIRECT, MoveUseMode.REFLECTED] as const;
    if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !dancerModes.includes(this.useMode)) {
      globalScene.getField(true).forEach(pokemon => {
        applyAbAttrs("PostMoveUsedAbAttr", { pokemon, move: this.move, source: user, targets });
      });
    }
  }

  /**
   * Queue a {@linkcode MoveChargePhase} for this phase's invoked move.
   */
  protected chargeMove(): void {
    globalScene.phaseManager.unshiftNew(
      "MoveChargePhase",
      this.pokemon.getBattlerIndex(),
      this.targets[0],
      this.move,
      this.useMode,
    );
  }

  /**
   * Queue a {@linkcode MoveEndPhase} and then end this phase.
   */
  public override end(): void {
    globalScene.phaseManager.unshiftNew(
      "MoveEndPhase",
      this.pokemon.getBattlerIndex(),
      this.getActiveTargetPokemon(),
      isVirtual(this.useMode),
    );

    super.end();
  }

  //#endregion Move Execution

  //#region Helpers

  /**
   * Handle cases where the move was cancelled or failed:
   * - Records a cancelled OR failed move in move history, so abilities like {@linkcode AbilityId.TRUANT | Truant} don't trigger on the
   *   next turn and soft-lock.
   * - Lapses `MOVE_EFFECT` tags:
   *   - Semi-invulnerable battler tags (Fly/Dive/etc.) are intended to lapse on move effects, but also need
   *     to lapse on move failure/cancellation.
   *
   *     TODO: ...this seems weird.
   * - Lapses `AFTER_MOVE` tags:
   *   - This handles the effects of {@linkcode MoveId.SUBSTITUTE | Substitute}
   * - Removes the second turn of charge moves
   */
  protected handlePreMoveFailures(): void {
    if (!this.cancelled && !this.failed) {
      return;
    }

    const pokemon = this.pokemon;

    if (this.cancelled && pokemon.summonData.tags.some(t => t.tagType === BattlerTagType.FRENZY)) {
      frenzyMissFunc(pokemon, this.move.getMove());
    }

    const moveHistoryEntry = this.moveHistoryEntry;
    // TODO: probably redundant; everything that sete `failed/cancelled` changes
    // the history entry
    moveHistoryEntry.result = MoveResult.FAIL;
    pokemon.pushMoveHistory(moveHistoryEntry);

    pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
    pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);

    // This clears out 2 turn moves after they've been used
    // TODO: Remove post move queue refactor
    pokemon.getMoveQueue().shift();
  }

  /** Signifies the current move should fail but still use PP */
  public fail(): void {
    this.failed = true;
    this.moveHistoryEntry.result = MoveResult.FAIL;
  }

  /** Signifies the current move should cancel and retain PP */
  public cancel(): void {
    this.cancelled = true;
    this.moveHistoryEntry.result = MoveResult.FAIL;
  }

  /** @returns An array containing all on-field `Pokemon` targeted by this Phase's invoked move. */
  public getActiveTargetPokemon(): Pokemon[] {
    return globalScene.getField(true).filter(p => this.targets.includes(p.getBattlerIndex()));
  }

  /**
   * Display the text for a move failing to execute.
   * @param failedText - The failure text to display; defaults to `"battle:attackFailed"` locale key
   * ("But it failed!" in english)
   */
  public showFailedText(failedText = i18next.t("battle:attackFailed")): void {
    globalScene.phaseManager.queueMessage(failedText);
  }

  /**
   * Fail the move currently being used.
   * Handles failure messages, pushing to move history, etc.
   * @param failedDueToTerrain - Whether the move failed due to terrain; default `false`
   */
  protected failMove(failedDueToTerrain = false) {
    const move = this.move.getMove();
    const targets = this.getActiveTargetPokemon();
    const pokemon = this.pokemon;

    // DO NOT CHANGE THE ORDER OF OPERATIONS HERE!
    // Protean is supposed to trigger its effects first, _then_ move text is displayed,
    // _then_ any blockage messages are shown.

    // Roar, Whirlwind, Trick-or-Treat, and Forest's Curse will trigger Protean/Libero
    // even on failure, as will all moves blocked by terrain.
    // TODO: Verify if this also applies to primal weather failures
    if (
      failedDueToTerrain
      || [MoveId.ROAR, MoveId.WHIRLWIND, MoveId.TRICK_OR_TREAT, MoveId.FORESTS_CURSE].includes(this.move.moveId)
    ) {
      applyAbAttrs("PokemonTypeChangeAbAttr", {
        pokemon,
        move,
        opponent: targets[0],
      });
    }

    pokemon.pushMoveHistory({
      move: move.id,
      targets: this.targets,
      result: MoveResult.FAIL,
      useMode: this.useMode,
    });

    // Use move-specific failure messages if present before checking terrain/weather blockage
    // and falling back to the classic "But it failed!".
    const failureMessage =
      move.getFailedText(pokemon, targets[0], move)
      || (failedDueToTerrain
        ? getTerrainBlockMessage(targets[0], globalScene.arena.getTerrainType())
        : i18next.t("battle:attackFailed"));

    this.showFailedText(failureMessage);

    // Remove the user from its semi-invulnerable state (if applicable)
    pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
  }

  /**
   * Queue animations and messages for the user's status effect triggering,
   * optionally cancelling the move as well.
   * @param effect - The effect being triggered
   * @param cancel - Whether to additionally cancel the current move usage; default `true`.
   *   Used by sleep-bypassing moves
   */
  private triggerStatus(effect: StatusEffect, cancel = true): void {
    const pokemon = this.pokemon;
    globalScene.phaseManager.queueMessage(getStatusEffectActivationText(effect, getPokemonNameWithAffix(pokemon)));
    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      pokemon.getBattlerIndex(),
      undefined,
      CommonAnim.POISON + (effect - 1), // offset anim # by effect #
    );
    if (cancel) {
      this.cancelled = true;
    }
  }

  //#endregion Helpers
}
