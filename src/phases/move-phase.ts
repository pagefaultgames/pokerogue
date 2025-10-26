// biome-ignore-start lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { Move, PreUseInterruptAttr } from "#types/move-types";
// biome-ignore-end lint/correctness/noUnusedImports: Used in a tsdoc comment

import { applyAbAttrs } from "#abilities/apply-ab-attrs";
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

  /** Signifies the current move should fail but still use PP */
  public fail(): void {
    this.moveHistoryEntry.result = MoveResult.FAIL;
    this.failed = true;
  }

  /** Signifies the current move should cancel and retain PP */
  public cancel(): void {
    this.cancelled = true;
    this.moveHistoryEntry.result = MoveResult.FAIL;
  }

  /**
   * Check the first round of failure checks
   *
   * @returns Whether the move failed
   *
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
    // A big if statement will handle the checks (that each have side effects!) in the correct order
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
   * Follow up moves need to check a subset of the first failure checks
   *
   * @remarks
   *
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
   * Handle the status interactions for sleep and freeze that happen after passing the first failure check
   *
   * @remarks
   * - If the user is asleep but can use the move, the sleep animation and message is still shown
   * - If the user is frozen but is thawed from its move, the user's status is cured and the thaw message is shown
   */
  private doThawCheck(): void {
    const user = this.pokemon;

    if (isIgnoreStatus(this.useMode)) {
      return;
    }
    if (this.thaw) {
      user.cureStatus(
        StatusEffect.FREEZE,
        i18next.t("statusEffect:freeze.healByMove", {
          pokemonName: getPokemonNameWithAffix(user),
          moveName: this.move.getMove().name,
        }),
      );
    }
  }

  /**
   * Second failure check that occurs after the "Pokemon used move" text is shown but BEFORE the move has been registered
   * as being the last move used (for the purposes of something like Copycat)
   *
   * @remarks
   * Other than powder, each failure condition is mutually exclusive (as they are tied to specific moves), so order does not matter.
   * Notably, this failure check only includes failure conditions intrinsic to the move itself, other than Powder (which marks the end of this failure check)
   *
   *
   * - Pollen puff used on an ally that is under effect of heal block
   * - Burn up / Double shock when the user does not have the required type
   * - No Retreat while already under its effects
   * - Failure due to primal weather
   * - (on cart, not applicable to Pokerogue) Moves that fail if used ON a raid / special boss: selfdestruct/explosion/imprision/power split / guard split
   * - (on cart, not applicable to Pokerogue) Moves that fail during a "co-op" battle (like when Arven helps during raid boss): ally switch / teatime
   *
   * After all checks, Powder causing the user to explode
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
    }
    return this.failed;
  }

  /**
   * Third failure check is from moves and abilities themselves
   *
   * @returns Whether the move failed
   *
   * @remarks
   * - Anything in {@linkcode Move.conditionsSeq3}
   * - Weather blocking the move
   * - Terrain blocking the move
   * - Queenly Majesty / Dazzling
   * - Damp (which is handled by move conditions in pokerogue rather than the ability, like queenly majesty / dazzling)
   *
   * The rest of the failure conditions are marked as sequence 4 and *should* happen in the move effect phase (though happen here for now)
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

  /**
   * Modifies `this.targets` in place, based upon:
   * - Move redirection abilities, effects, etc.
   * - Counterattacks, which pass a special value into the `targets` constructor param (`[`{@linkcode BattlerIndex.ATTACKER}`]`).
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

  public start(): void {
    super.start();

    if (!this.pokemon.isActive(true)) {
      this.end();
      return;
    }

    const user = this.pokemon;

    // Removing Glaive Rush's two flags *always* happens first
    user.removeTag(BattlerTagType.ALWAYS_GET_HIT);
    user.removeTag(BattlerTagType.RECEIVE_DOUBLE_DAMAGE);
    console.log(MoveId[this.move.moveId], enumValueToKey(MoveUseMode, this.useMode));

    // For the purposes of payback and kin, the pokemon is considered to have acted
    // if it attempted to move at all.
    user.turnData.acted = true;
    const useMode = this.useMode;
    const ignoreStatus = isIgnoreStatus(useMode);
    const isFollowUp = useMode === MoveUseMode.FOLLOW_UP;
    if (!ignoreStatus) {
      this.firstFailureCheck();
      user.lapseTags(BattlerTagLapseType.PRE_MOVE);
      // At this point, called moves should be decided.
      // For now, this comment works as a placeholder until called moves are reworked
      // For correct alignment with mainline, this SHOULD go here, and this phase SHOULD rewrite its own move
    } else if (isFollowUp) {
      // Follow up moves need to make sure the called move passes a few of the conditions to continue
      this.followUpMoveFirstFailureCheck();
    }
    // If the first failure check did not pass, then the move is cancelled
    // Note: This only checks `cancelled`, as `failed` should NEVER be set by anything in the first failure check
    if (this.cancelled) {
      this.handlePreMoveFailures();
      this.end();
      return;
    }

    // If the first failure check passes (and this is not a sub-move) then thaw the user if its move will thaw it.
    if (!isFollowUp) {
      this.doThawCheck();
    }

    // Reset hit-related turn data when starting follow-up moves (e.g. Metronomed moves, Dancer repeats)
    if (isVirtual(useMode)) {
      const turnData = user.turnData;
      turnData.hitsLeft = -1;
      turnData.hitCount = 0;
    }

    const pokemonMove = this.move;

    // Check move to see if arena.ignoreAbilities should be true.
    if (
      pokemonMove.getMove().doesFlagEffectApply({
        flag: MoveFlags.IGNORE_ABILITIES,
        user,
        isFollowUp: isVirtual(useMode), // Sunsteel strike and co. don't work when called indirectly
      })
    ) {
      globalScene.arena.setIgnoreAbilities(true, user.getBattlerIndex());
    }

    // At this point, move's type changing and multi-target effects *should* be applied
    // Pokerogue's current implementation applies these effects during the move effect phase
    // as there is not (yet) a notion of a move-in-flight for determinations to occur

    this.resolveRedirectTarget();
    this.resolveCounterAttackTarget();

    // If this is the *release* turn of the charge move, PP is not deducted
    const move = this.move.getMove();

    const isChargingMove = move.isChargingMove();
    /** Indicates this is the charging turn of the move */
    const charging = isChargingMove && !user.getTag(BattlerTagType.CHARGING);
    /** Indicates this is the release turn of the move */
    const releasing = isChargingMove && !charging;

    // Update the battle's "last move" pointer unless we're currently mimicking a move or triggering Dancer.
    if (!move.hasAttr("CopyMoveAttr") && !isReflected(useMode)) {
      globalScene.currentBattle.lastMove = move.id;
    }

    // Charging moves consume PP when they begin charging, *not* when they release
    if (!releasing) {
      this.usePP();
    }

    if (!isFollowUp) {
      // Gorilla tactics lock in (and choice items if they are ever added)
      // Stance Change form change
      // Struggle's "There are no more moves it can use" message

      globalScene.triggerPokemonFormChange(user, SpeciesFormChangePreMoveTrigger);
      // TODO: apply gorilla tactics here instead of in the move effect phase
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

  /**
   * Check for cancellation edge cases - no targets remaining
   * @returns Whether the move fails
   */
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

  public getActiveTargetPokemon(): Pokemon[] {
    return globalScene.getField(true).filter(p => this.targets.includes(p.getBattlerIndex()));
  }

  /**
   * Queue the status activation message, play its animation, and cancel the move
   *
   * @param effect - The effect being triggered
   * @param cancel - Whether to cancel the move after triggering the status
   *   effect animation  message; default `true`. Set to `false` for
   *   sleep-bypassing moves to avoid cancelling attack.
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

  /**
   * Handle the sleep check
   * @returns Whether the move was cancelled due to sleep
   */
  protected checkSleep(): boolean {
    const user = this.pokemon;
    if (user.status?.effect !== StatusEffect.SLEEP) {
      return false;
    }

    // For some reason, dancer will immediately wake its user from sleep when triggering
    if (this.useMode === MoveUseMode.INDIRECT) {
      user.resetStatus(false);
      return false;
    }

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

    const bypassSleepHolder = new BooleanHolder(false);
    applyMoveAttrs("BypassSleepAttr", this.pokemon, null, this.move.getMove(), bypassSleepHolder);
    const cancel = !bypassSleepHolder.value;
    this.triggerStatus(StatusEffect.SLEEP, cancel);
    return cancel;
  }

  /**
   * Handle the freeze status effect check
   *
   * @remarks
   * Responsible for the following
   * - Checking if the pokemon is frozen
   * - Checking if the pokemon will thaw from random chance, OR from a thawing move.
   *    Thawing from a freeze move is not applied until AFTER all other failure checks.
   * - Activating the freeze status effect (cancelling the move, playing the message, and displaying the animation)
   * @returns Whether the move was cancelled due to the pokemon being frozen
   */
  protected checkFreeze(): boolean {
    const pokemon = this.pokemon;
    if (pokemon.status?.effect !== StatusEffect.FREEZE) {
      return false;
    }

    // For some reason, dancer will immediately thaw its user
    if (this.useMode === MoveUseMode.INDIRECT) {
      pokemon.resetStatus(false);
      return false;
    }

    if (Overrides.STATUS_ACTIVATION_OVERRIDE) {
      return false;
    }

    // Check if the move will heal
    const move = this.move.getMove();
    if (
      move.findAttr(attr => attr.selfTarget && attr.is("HealStatusEffectAttr") && attr.isOfEffect(StatusEffect.FREEZE))
      && (move.id !== MoveId.BURN_UP || pokemon.isOfType(PokemonType.FIRE, true, true))
    ) {
      this.thaw = true;
      return false;
    }
    if (
      Overrides.STATUS_ACTIVATION_OVERRIDE === false
      || this.move
        .getMove()
        .findAttr(attr => attr.selfTarget && attr.is("HealStatusEffectAttr") && attr.isOfEffect(StatusEffect.FREEZE))
      || (!pokemon.randBattleSeedInt(5) && Overrides.STATUS_ACTIVATION_OVERRIDE !== true)
    ) {
      pokemon.cureStatus(StatusEffect.FREEZE);
      return false;
    }

    this.triggerStatus(StatusEffect.FREEZE);
    return true;
  }

  /**
   * Check if the move is usable based on PP
   * @returns Whether the move was cancelled due to insufficient PP
   */
  protected checkPP(): boolean {
    const move = this.move;
    if (move.getMove().pp !== -1 && !isIgnorePP(this.useMode) && move.ppUsed >= move.getMovePp()) {
      this.cancel();
      this.showFailedText();
      return true;
    }
    return false;
  }

  /**
   * Check if the move is valid and not in an error state
   *
   * @remarks
   * Checks occur in the following order
   * 1. Move is not implemented
   * 2. Move is somehow invalid (it is {@linkcode MoveId.NONE} or {@linkcode targets} is somehow empty)
   * 3. Move cannot be used by the player due to a challenge
   *
   * @returns Whether the move was cancelled due to being invalid
   */
  protected checkValidity(): boolean {
    const move = this.move;
    const moveId = move.moveId;
    const moveName = move.getName();
    let failedText: string | undefined;
    const usability = new BooleanHolder(false);
    if (moveName.endsWith(" (N)")) {
      failedText = i18next.t("battle:moveNotImplemented", { moveName: moveName.replace(" (N)", "") });
    } else if (moveId === MoveId.NONE || this.targets.length === 0) {
      this.cancel();

      const pokemonName = this.pokemon.name;
      const warningText =
        moveId === MoveId.NONE
          ? `${pokemonName} is attempting to use MoveId.NONE`
          : `${pokemonName} is attempting to use a move with no targets`;

      console.warn(warningText);

      return true;
    } else if (
      this.pokemon.isPlayer()
      && applyChallenges(ChallengeType.POKEMON_MOVE, moveId, usability) // check the value inside of usability after calling applyChallenges
      && !usability.value
    ) {
      failedText = i18next.t("battle:moveCannotUseChallenge", { moveName });
    } else {
      return false;
    }

    this.cancel();
    this.showFailedText(failedText);
    return true;
  }

  /**
   * Cancel the move if its pre use condition fails
   *
   * @remarks
   * The only official move with a pre-use condition is Focus Punch
   *
   * @returns Whether the move was cancelled due to a pre-use interruption
   * @see {@linkcode PreUseInterruptAttr}
   */
  private checkPreUseInterrupt(): boolean {
    const move = this.move.getMove();
    const user = this.pokemon;
    const target = this.getActiveTargetPokemon()[0];
    return move.getAttrs("PreUseInterruptAttr").some(attr => {
      attr.apply(user, target, move);
      if (this.cancelled) {
        return true;
      }
      return false;
    });
  }

  /**
   * Lapse the tag type and check if the move is cancelled from it. Meant to be used during the first failure check
   * @param tag - The tag type whose lapse method will be called with {@linkcode BattlerTagLapseType.PRE_MOVE}
   * @param checkIgnoreStatus - Whether to check {@link isIgnoreStatus} for the current {@linkcode MoveUseMode} to skip this check
   * @returns Whether the move was cancelled due to a `BattlerTag` effect
   */
  private checkTagCancel(tag: BattlerTagType): boolean {
    this.pokemon.lapseTag(tag, BattlerTagLapseType.PRE_MOVE);
    return this.cancelled;
  }

  /**
   * Handle move failures due to Gravity, cancelling the move and showing the failure text
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
   * Handle the paralysis status effect check, cancelling the move and queueing the activation message and animation
   *
   * @returns Whether the move was cancelled due to paralysis
   */
  private checkPara(): boolean {
    if (this.pokemon.status?.effect !== StatusEffect.PARALYSIS) {
      return false;
    }
    const proc = Overrides.STATUS_ACTIVATION_OVERRIDE ?? this.pokemon.randBattleSeedInt(4) === 0;
    if (!proc) {
      return false;
    }
    this.triggerStatus(StatusEffect.PARALYSIS);
    return true;
  }

  /**
   * Deduct PP from the move being used, accounting for Pressure and other effects
   */
  protected usePP(): void {
    if (!isIgnorePP(this.useMode)) {
      const move = this.move;
      // "commit" to using the move, deducting PP.
      const ppUsed = 1 + this.getPpIncreaseFromPressure(this.getActiveTargetPokemon());
      move.usePp(ppUsed);
      globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon.id, move.getMove(), move.ppUsed));
    }
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
      console.log("Move failed during third failure check");
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
      console.log("Move failed during fourth failure check");
      this.failMove();
      return;
    }

    if (charging) {
      this.chargeMove();
    } else {
      this.executeMove();
    }
  }

  /** Execute the current move and apply its effects. */
  private executeMove() {
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
   * Fail the move currently being used.
   * Handles failure messages, pushing to move history, etc.
   * @param failedDueToTerrain - Whether the move failed due to terrain (default `false`)
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
   * Queue a {@linkcode MoveChargePhase} for this phase's invoked move.
   */
  protected chargeMove() {
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
   * Applies PP increasing abilities (currently only {@linkcode AbilityId.PRESSURE | Pressure}) if they exist on the target pokemon.
   * Note that targets must include only active pokemon.
   *
   * TODO: This hardcodes the PP increase at 1 per opponent, rather than deferring to the ability.
   */
  public getPpIncreaseFromPressure(targets: Pokemon[]): number {
    const foesWithPressure = this.pokemon
      .getOpponents(true)
      .filter(opponent => targets.includes(opponent) && opponent.hasAbilityWithAttr("IncreasePpAbAttr"));
    return foesWithPressure.length;
  }

  /**
   * Update the targets of any counter-attacking moves with `[`{@linkcode BattlerIndex.ATTACKER}`]` set
   * to reflect the actual battler index of the user's last attacker.
   *
   * If there is no last attacker or they are no longer on the field, a message is displayed and the
   * move is marked for failure
   */
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
   * Handles the case where the move was cancelled or failed:
   * - Uses PP if the move failed (not cancelled) and should use PP (failed moves are not affected by {@linkcode AbilityId.PRESSURE | Pressure})
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
    moveHistoryEntry.result = MoveResult.FAIL;
    pokemon.pushMoveHistory(moveHistoryEntry);

    pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
    pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);

    // This clears out 2 turn moves after they've been used
    // TODO: Remove post move queue refactor
    pokemon.getMoveQueue().shift();
  }

  /**
   * Displays the move's usage text to the player as applicable for the move being used.
   */
  public showMoveText(): void {
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
   * Display the text for a move failing to execute.
   * @param failedText - The failure text to display; defaults to `"battle:attackFailed"` locale key
   * ("But it failed!" in english)
   */
  public showFailedText(failedText = i18next.t("battle:attackFailed")): void {
    globalScene.phaseManager.queueMessage(failedText);
  }
}
