/**
 * Manager for phases used by battle scene.
 *
 * @remarks
 * **This file must not be imported or used directly.**
 * The manager is exclusively used by the Battle Scene and is NOT intended for external use.
 * @module
 */

import { PHASE_START_COLOR } from "#app/constants/colors";
import { DynamicQueueManager } from "#app/dynamic-queue-manager";
import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { PhaseTree } from "#app/phase-tree";
import type { BattlerIndex, FieldBattlerIndex } from "#enums/battler-index";
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import { SwitchType } from "#enums/switch-type";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
import { AddEnemyBuffModifierPhase } from "#phases/add-enemy-buff-modifier-phase";
import { AttemptCapturePhase } from "#phases/attempt-capture-phase";
import { AttemptRunPhase } from "#phases/attempt-run-phase";
import { BattleEndPhase } from "#phases/battle-end-phase";
import { BerryPhase } from "#phases/berry-phase";
import { CheckInterludePhase } from "#phases/check-interlude-phase";
import { CheckStatusEffectPhase } from "#phases/check-status-effect-phase";
import { CheckSwitchPhase } from "#phases/check-switch-phase";
import { CommandPhase } from "#phases/command-phase";
import { CommonAnimPhase } from "#phases/common-anim-phase";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { DynamicPhaseMarker } from "#phases/dynamic-phase-marker";
import { EggHatchPhase } from "#phases/egg-hatch-phase";
import { EggLapsePhase } from "#phases/egg-lapse-phase";
import { EggSummaryPhase } from "#phases/egg-summary-phase";
import { EncounterPhase } from "#phases/encounter-phase";
import { EndCardPhase } from "#phases/end-card-phase";
import { EndEvolutionPhase } from "#phases/end-evolution-phase";
import { EnemyCommandPhase } from "#phases/enemy-command-phase";
import { EvolutionPhase } from "#phases/evolution-phase";
import { ExpPhase } from "#phases/exp-phase";
import { FaintPhase } from "#phases/faint-phase";
import { FormChangePhase } from "#phases/form-change-phase";
import { GameOverModifierRewardPhase } from "#phases/game-over-modifier-reward-phase";
import { GameOverPhase } from "#phases/game-over-phase";
import { HideAbilityPhase } from "#phases/hide-ability-phase";
import { HidePartyExpBarPhase } from "#phases/hide-party-exp-bar-phase";
import { InitEncounterPhase } from "#phases/init-encounter-phase";
import { LearnMovePhase } from "#phases/learn-move-phase";
import { LevelCapPhase } from "#phases/level-cap-phase";
import { LevelUpPhase } from "#phases/level-up-phase";
import { LoadMoveAnimPhase } from "#phases/load-move-anim-phase";
import { LoginPhase } from "#phases/login-phase";
import { MessagePhase } from "#phases/message-phase";
import { ModifierRewardPhase } from "#phases/modifier-reward-phase";
import { MoneyRewardPhase } from "#phases/money-reward-phase";
import { MoveAnimPhase } from "#phases/move-anim-phase";
import { MoveChargePhase } from "#phases/move-charge-phase";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { MoveHeaderPhase } from "#phases/move-header-phase";
import { MovePhase } from "#phases/move-phase";
import {
  MysteryEncounterBattlePhase,
  MysteryEncounterBattleStartCleanupPhase,
  MysteryEncounterOptionSelectedPhase,
  MysteryEncounterPhase,
  MysteryEncounterRewardsPhase,
  PostMysteryEncounterPhase,
} from "#phases/mystery-encounter-phases";
import { NewBattlePhase } from "#phases/new-battle-phase";
import { NewBiomeEncounterPhase } from "#phases/new-biome-encounter-phase";
import { NextEncounterPhase } from "#phases/next-encounter-phase";
import { ObtainStatusEffectPhase } from "#phases/obtain-status-effect-phase";
import { PartyExpPhase } from "#phases/party-exp-phase";
import { PartyHealPhase } from "#phases/party-heal-phase";
import { PokemonAnimPhase } from "#phases/pokemon-anim-phase";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { PokemonTransformPhase } from "#phases/pokemon-transform-phase";
import { PositionalTagPhase } from "#phases/positional-tag-phase";
import { PostGameOverPhase } from "#phases/post-game-over-phase";
import { PostSummonPhase } from "#phases/post-summon-phase";
import { PostTurnStatusEffectPhase } from "#phases/post-turn-status-effect-phase";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { RecallPhase } from "#phases/recall-phase";
import { ReloadSessionPhase } from "#phases/reload-session-phase";
import { ResetStatusPhase } from "#phases/reset-status-phase";
import { RevivalBlessingPhase } from "#phases/revival-blessing-phase";
import { RibbonModifierRewardPhase } from "#phases/ribbon-modifier-reward-phase";
import { ScanIvsPhase } from "#phases/scan-ivs-phase";
import { SelectBiomePhase } from "#phases/select-biome-phase";
import { SelectChallengePhase } from "#phases/select-challenge-phase";
import { SelectGenderPhase } from "#phases/select-gender-phase";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { SelectTargetPhase } from "#phases/select-target-phase";
import { ShinySparklePhase } from "#phases/shiny-sparkle-phase";
import { ShowAbilityPhase } from "#phases/show-ability-phase";
import { ShowPartyExpBarPhase } from "#phases/show-party-exp-bar-phase";
import { ShowTrainerPhase } from "#phases/show-trainer-phase";
import { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import { SummonPhase, type SummonPhaseOptions } from "#phases/summon-phase";
import { SwitchBiomePhase } from "#phases/switch-biome-phase";
import { SwitchPhase } from "#phases/switch-phase";
import { TeraPhase } from "#phases/tera-phase";
import { TitlePhase } from "#phases/title-phase";
import { ToggleDoublePositionPhase } from "#phases/toggle-double-position-phase";
import { TrainerVictoryPhase } from "#phases/trainer-victory-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { TurnStartPhase } from "#phases/turn-start-phase";
import { UnavailablePhase } from "#phases/unavailable-phase";
import { UnlockPhase } from "#phases/unlock-phase";
import { VictoryPhase } from "#phases/victory-phase";
import { WeatherEffectPhase } from "#phases/weather-effect-phase";
import type { PhaseConditionFunc, PhaseMap, PhaseString } from "#types/phase-types";
import { isEnemy } from "#utils/pokemon-utils";
import type { queueBattlerEntrancePhases } from "#utils/switch-utils";
import type { NonEmptyTuple } from "type-fest";

//#region Constants

/**
 * Object that holds all of the phase constructors.
 * This is used to create new phases dynamically using the `newPhase` method in the `PhaseManager`.
 *
 * @remarks
 * The keys of this object are the names of the phases, and the values are the constructors of the phases.
 * This allows for easy creation of new phases without needing to import each phase individually.
 */
const PHASES = Object.freeze({
  AddEnemyBuffModifierPhase,
  AttemptCapturePhase,
  AttemptRunPhase,
  BattleEndPhase,
  BerryPhase,
  CheckInterludePhase,
  CheckStatusEffectPhase,
  CheckSwitchPhase,
  CommandPhase,
  CommonAnimPhase,
  DamageAnimPhase,
  DynamicPhaseMarker,
  EggHatchPhase,
  EggLapsePhase,
  EggSummaryPhase,
  EncounterPhase,
  EndCardPhase,
  EndEvolutionPhase,
  EnemyCommandPhase,
  EvolutionPhase,
  ExpPhase,
  FaintPhase,
  FormChangePhase,
  GameOverPhase,
  GameOverModifierRewardPhase,
  HideAbilityPhase,
  HidePartyExpBarPhase,
  InitEncounterPhase,
  LearnMovePhase,
  LevelCapPhase,
  LevelUpPhase,
  LoadMoveAnimPhase,
  LoginPhase,
  MessagePhase,
  ModifierRewardPhase,
  MoneyRewardPhase,
  MoveAnimPhase,
  MoveChargePhase,
  MoveEffectPhase,
  MoveEndPhase,
  MoveHeaderPhase,
  MovePhase,
  MysteryEncounterPhase,
  MysteryEncounterOptionSelectedPhase,
  MysteryEncounterBattlePhase,
  MysteryEncounterBattleStartCleanupPhase,
  MysteryEncounterRewardsPhase,
  PostMysteryEncounterPhase,
  NewBattlePhase,
  NewBiomeEncounterPhase,
  NextEncounterPhase,
  ObtainStatusEffectPhase,
  PartyExpPhase,
  PartyHealPhase,
  PokemonAnimPhase,
  PokemonHealPhase,
  PokemonTransformPhase,
  PositionalTagPhase,
  PostGameOverPhase,
  PostSummonPhase,
  PostTurnStatusEffectPhase,
  QuietFormChangePhase,
  ReloadSessionPhase,
  ResetStatusPhase,
  RecallPhase,
  RevivalBlessingPhase,
  RibbonModifierRewardPhase,
  ScanIvsPhase,
  SelectBiomePhase,
  SelectChallengePhase,
  SelectGenderPhase,
  SelectModifierPhase,
  SelectStarterPhase,
  SelectTargetPhase,
  ShinySparklePhase,
  ShowAbilityPhase,
  ShowPartyExpBarPhase,
  ShowTrainerPhase,
  StatStageChangePhase,
  SummonPhase,
  SwitchPhase,
  SwitchBiomePhase,
  TeraPhase,
  TitlePhase,
  ToggleDoublePositionPhase,
  TrainerVictoryPhase,
  TurnEndPhase,
  TurnInitPhase,
  TurnStartPhase,
  UnavailablePhase,
  UnlockPhase,
  VictoryPhase,
  WeatherEffectPhase,
});

// This type export cannot be moved to `@types`, as `Phases` is intentionally private to this file
/** Maps Phase strings to their constructors */
export type PhaseConstructorMap = typeof PHASES;

/** Phases pushed at the end of each {@linkcode TurnStartPhase} */
const turnEndPhases: readonly PhaseString[] = [
  "WeatherEffectPhase",
  "PositionalTagPhase",
  "BerryPhase",
  "CheckStatusEffectPhase",
  "TurnEndPhase",
] as const;

interface BattlerEntranceParams extends SummonPhaseOptions {
  /**
   * String denoting when to add the phase.
   * Possible values are:
   *  - `"eager"`: Adds the phase immediately via {@linkcode PhaseManager.unshiftPhase | unshiftPhase}
   *  - `"delayed"`: Adds the phase via {@linkcode PhaseManager.pushPhase} to run after all phases finish running.
   */
  // TODO: Figure out a default value for this and remove it from existing callsites
  when: "eager" | "delayed";

  /**
   * Whether to queue a {@linkcode CheckSwitchPhase} instead of a {@linkcode PostSummonPhase} after the entrance anim
   * to ask the player if they would like to switch _BEFORE_ applying on-entrance effects. \
   * If the switch prompt is denied, a regular {@linkcode PostSummonPhase} will be queued after said phase ends.
   * @defaultValue `true` if the passed `BattlerIndex` corresponds to a player Pokemon.
   */
  checkSwitch?: boolean;
}

type queueBattlerEntranceParams<P extends boolean> = P extends true
  ? BattlerEntranceParams
  : Omit<BattlerEntranceParams, "checkSwitch">;

interface BattlerSwitchOutParams {
  /**
   * String denoting when to add the phase.
   * Possible values are:
   *  - `"eager"`: Adds the phase immediately via {@linkcode PhaseManager.unshiftPhase | unshiftPhase}
   *  - `"deferred"`: Adds the phase immediately after all phases queued during this Phase have resolved. \
   *    Used by force switching moves and abilities to queue switch outs after the current move use ends.
   * @defaultValue `"eager"`
   */
  when?: "eager" | "deferred";

  /**
   * A {@linkcode SwitchType} dictating the type of switching behavior to implement.
   * @defaultValue {@linkcode SwitchType.SWITCH}
   */
  switchType?: SwitchType;
  /**
   * The party index of the Pokemon being newly switched in.
   * If set to `-1`, will determine the replacement during the {@linkcode SummonPhase}
   * by showing the player party modal or prompting the enemy AI.
   * @defaultValue `-1`
   */
  switchInIndex?: number;
}
//#endregion Constants

/**
 * The `PhaseManager` is responsible for managing the phases in the Battle Scene.
 */
export class PhaseManager {
  /** A multi-dimensional queue of phases being run. */
  // TODO: Consider renaming given this is no longer a simple queue
  private readonly phaseQueue: PhaseTree = new PhaseTree();

  /** Holds priority queues for dynamically ordered phases */
  public dynamicQueueManager = new DynamicQueueManager();

  /** The currently-running {@linkcode Phase}. */
  private currentPhase: Phase;
  /** The phase put on standby if {@linkcode overridePhase} is called */
  private standbyPhase: Phase | null = null;

  // #region Phase Helper Functions

  /**
   * Clear all previously set phases, then add a new {@linkcode TitlePhase} to transition to the title screen.
   * @param addLogin - Whether to add a new {@linkcode LoginPhase} before the {@linkcode TitlePhase}
   * (but reset everything else).
   * Default `false`
   */
  public toTitleScreen(addLogin = false): void {
    this.clearAllPhases();

    if (addLogin) {
      this.unshiftNew("LoginPhase");
    }
    this.unshiftNew("TitlePhase");
  }

  /**
   * Queue a sequence of phases to switch out a Pokemon on the field.
   * @param battlerIndex - The {@linkcode FieldBattlerIndex} of the Pokemon to switch out
   * @param __namedParameters - Needed for Typedoc to function
   */
  public queueBattlerSwitchOut(
    battlerIndex: FieldBattlerIndex,
    { switchType = SwitchType.SWITCH, switchInIndex = -1, when = "eager" }: BattlerSwitchOutParams = {},
  ): void {
    const phases = [
      this.create("RecallPhase", battlerIndex, switchType),
      this.create("SwitchPhase", battlerIndex, switchType, switchInIndex),
      this.create("SummonPhase", battlerIndex, { switchType }),
      this.create("PostSummonPhase", battlerIndex),
    ] as const;

    switch (when) {
      case "eager":
        this.unshiftPhase(...phases);
        break;
      case "deferred":
        this.phaseQueue.addPhase(phases, true);
        break;
    }
  }

  /**
   * Queue a sequence of phases to add a single Pokemon to the field.
   * Encompasses both visual and logical elements.
   * @param battlerIndex - The {@linkcode FieldBattlerIndex} of the Pokemon to send in
   * @param params - Parameters used to customize switching behavior
   * @throws {Error}
   * Throws an error if `battlerIndex` corresponds to an enemy Pokemon with `checkSwitch` set to `true`
   * @see {@linkcode queueBattlerEntrancePhases}
   * Alternate helper function that queues phases for multiple Pokemon entering the field.
   */
  public queueBattlerEntrance<T extends FieldBattlerIndex>(
    battlerIndex: T,
    params: queueBattlerEntranceParams<T extends BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 ? true : false>,
  ): void;
  public queueBattlerEntrance(
    battlerIndex: FieldBattlerIndex,
    { when, checkSwitch = !isEnemy(battlerIndex), ...rest }: BattlerEntranceParams,
  ): void {
    if (checkSwitch && isEnemy(battlerIndex)) {
      throw new Error("Cannot queue a CheckSwitchPhase for an enemy Pokemon!");
    }

    const phases = [
      this.create("SummonPhase", battlerIndex, rest),
      this.create(checkSwitch ? "CheckSwitchPhase" : "PostSummonPhase", battlerIndex),
    ] as const;

    switch (when) {
      case "eager":
        this.unshiftPhase(...phases);
        break;
      case "delayed":
        this.pushPhase(...phases);
        break;
    }
  }

  // #endregion Phase Helper Functions

  // #region Phase Functions

  /** @returns The currently running {@linkcode Phase}. */
  getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Add one or more Phases to the end of the queue.
   * They will run once all phases already in the queue have ended.
   * @param phases - One or more {@linkcode Phase}s to add
   */
  public pushPhase(...phases: NonEmptyTuple<Phase>): void {
    for (const phase of phases) {
      this.phaseQueue.pushPhase(this.checkDynamic(phase));
    }
  }

  /**
   * Queue one or more phases to be run immediately after the current phase finishes. \
   * Unshifted phases are run in FIFO order if multiple are queued during a single phase's execution.
   * @param phases - One or more {@linkcode Phase}s to add
   * @privateRemarks
   * Any newly-unshifted `MovePhase`s will be queued after the next `MoveEndPhase`.
   */
  public unshiftPhase(...phases: NonEmptyTuple<Phase>): void {
    for (const phase of phases) {
      const toAdd = this.checkDynamic(phase);
      if (phase.is("MovePhase")) {
        this.phaseQueue.addAfter(toAdd, "MoveEndPhase");
      } else {
        this.phaseQueue.addPhase(toAdd);
      }
    }
  }

  /**
   * Helper method to queue a phase as dynamic if necessary
   * @param phase - The phase to check
   * @returns The {@linkcode Phase} or a {@linkcode DynamicPhaseMarker} to be used in its place
   */
  private checkDynamic(phase: Phase): Phase {
    if (this.dynamicQueueManager.queueDynamicPhase(phase)) {
      return new DynamicPhaseMarker(phase.phaseName);
    }
    return phase;
  }

  /**
   * Clear all Phases from the queue.
   * @param leaveUnshifted - If `true`, leaves the top level of the tree intact; default `false`
   */
  public clearPhaseQueue(leaveUnshifted = false): void {
    this.phaseQueue.clear(leaveUnshifted);
  }

  /** Clear all phase queues and the standby phase. */
  public clearAllPhases(): void {
    this.clearPhaseQueue();
    this.dynamicQueueManager.clearQueues();
    this.standbyPhase = null;
  }

  /**
   * Determine the next phase to run and start it.
   * @privateRemarks
   * This is called by {@linkcode Phase.end} by default, and should not be called by other methods.
   */
  public shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    let nextPhase = this.phaseQueue.getNextPhase();

    if (nextPhase?.is("DynamicPhaseMarker")) {
      nextPhase = this.dynamicQueueManager.popNextPhase(nextPhase.phaseType);
    }

    if (nextPhase == null) {
      this.turnStart();
    } else {
      this.currentPhase = nextPhase;
    }

    this.startCurrentPhase();
  }

  /**
   * Helper method to start and log the current phase.
   *
   * @privateRemarks
   * This is disabled during tests by `phase-interceptor.ts` to allow for pausing execution at specific phases.
   * As such, **do not remove or split this method** as it will break integration tests.
   */
  private startCurrentPhase(): void {
    console.log(`%cStart Phase ${this.currentPhase.phaseName}`, `color:${PHASE_START_COLOR};`);
    this.currentPhase.start();
  }

  /**
   * Override the currently running phase with another
   * @param phase - The {@linkcode Phase} to override the current one with
   * @returns If the override succeeded
   *
   * @todo This is antithetical to the phase structure and used a single time. Remove it.
   */
  public overridePhase(phase: Phase): boolean {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    this.startCurrentPhase();

    return true;
  }

  /**
   * Determine if there is a queued {@linkcode Phase} meeting the specified conditions.
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param condition - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a matching phase exists
   */
  public hasPhaseOfType<T extends PhaseString>(name: T, condition?: PhaseConditionFunc<T>): boolean {
    return this.dynamicQueueManager.exists(name, condition) || this.phaseQueue.exists(name, condition);
  }

  /**
   * Attempt to find and remove the first queued {@linkcode Phase} meeting the given condition.
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a phase was successfully removed
   */
  public tryRemovePhase<T extends PhaseString>(name: T, phaseFilter?: PhaseConditionFunc<T>): boolean {
    return this.dynamicQueueManager.removePhase(name, phaseFilter) || this.phaseQueue.remove(name, phaseFilter);
  }

  /**
   * Remove all instances of the given {@linkcode Phase}.
   * @param name - The {@linkcode PhaseString | name} of the `Phase` to remove
   *
   * @remarks
   * This is not intended to be used with dynamically ordered phases, and does not operate on the dynamic queue. \
   * However, it does remove {@linkcode DynamicPhaseMarker}s and so would prevent such phases from activating.
   */
  public removeAllPhasesOfType(name: PhaseString): void {
    this.phaseQueue.removeAll(name);
  }

  /**
   * Add a `MessagePhase` to the queue.
   * @param message - string for MessagePhase
   * @param callbackDelay - optional param for MessagePhase constructor
   * @param prompt - optional param for MessagePhase constructor
   * @param promptDelay - optional param for MessagePhase constructor
   * @param defer - If `true`, push the phase instead of unshifting; default `false`
   *
   * @see {@linkcode MessagePhase} for more details on the parameters
   */
  queueMessage(
    message: string,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
    defer?: boolean | null,
  ) {
    const phase = new MessagePhase(message, callbackDelay, prompt, promptDelay);
    if (defer) {
      this.pushPhase(phase);
    } else {
      this.unshiftPhase(phase);
    }
  }

  /**
   * Queue an ability bar flyout phase via {@linkcode unshiftPhase}
   * @param pokemon - The {@linkcode Pokemon} whose ability is being activated
   * @param passive - Whether the ability is a passive
   * @param show - If `true`, show the bar. Otherwise, hide it
   */
  public queueAbilityDisplay(pokemon: Pokemon, passive: boolean, show: boolean): void {
    this.unshiftPhase(show ? new ShowAbilityPhase(pokemon.getBattlerIndex(), passive) : new HideAbilityPhase());
  }

  /**
   * Hide the ability bar if it is currently visible.
   */
  public hideAbilityBar(): void {
    if (globalScene.abilityBar.isVisible()) {
      this.unshiftPhase(new HideAbilityPhase());
    }
  }

  /**
   * Clear all dynamic queues and begin a new {@linkcode TurnInitPhase} for the current turn.
   * Called whenever the current phase queue is empty.
   */
  private turnStart(): void {
    this.dynamicQueueManager.clearQueues();
    this.currentPhase = new TurnInitPhase();
  }

  /**
   * Dynamically create the named phase from the provided arguments.
   *
   * @param phase - The name of the phase to create.
   * @param args - The arguments to pass to the phase constructor.
   * @returns The created phase instance.
   * @remarks
   * Used to avoid importing each phase individually, allowing for dynamic creation of phases.
   */
  public create<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): PhaseMap[T] {
    const PhaseClass = PHASES[phase];

    if (!PhaseClass) {
      throw new Error(`Phase ${phase} does not exist in PhaseMap.`);
    }

    // @ts-expect-error: Typescript does not support narrowing the type of operands in generic methods (see https://stackoverflow.com/a/72891234)
    return new PhaseClass(...args);
  }

  /**
   * Create a new phase and immediately push it to the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode pushPhase}.
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public pushNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.pushPhase(this.create(phase, ...args));
  }

  /**
   * Create a new phase and immediately unshift it to the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode unshiftPhase}.
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public unshiftNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.unshiftPhase(this.create(phase, ...args));
  }

  /**
   * Add a {@linkcode FaintPhase} to the queue.
   * @param args - The arguments to pass to the phase constructor
   *
   * @remarks
   *
   * Faint phases are ordered in a special way to allow battle effects to settle before the Pokemon faints.
   * @see {@linkcode PhaseTree.addPhase}
   */
  public queueFaintPhase(...args: ConstructorParameters<PhaseConstructorMap["FaintPhase"]>): void {
    this.phaseQueue.addPhase(this.create("FaintPhase", ...args), true);
  }

  /**
   * Find and return the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   * @returns The retrieved `MovePhase`, or `undefined` if none meet the criteria.
   */
  public getMovePhase(phaseCondition: PhaseConditionFunc<"MovePhase">): MovePhase | undefined {
    return this.dynamicQueueManager.getMovePhase(phaseCondition);
  }

  /**
   * Find and cancel the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   */
  public cancelMove(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.cancelMovePhase(phaseCondition);
  }

  /**
   * Find and forcibly reorder the first {@linkcode MovePhase} meeting the given condition to move next.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   */
  public forceMoveNext(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.FIRST);
  }

  /**
   * Find and forcibly reorder the first {@linkcode MovePhase} meeting the given condition to move last.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   */
  public forceMoveLast(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.LAST);
  }

  /**
   * Find and change the queued move of the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   * @param move - The {@linkcode PokemonMove | move} to use in replacement
   */
  public changePhaseMove(phaseCondition: PhaseConditionFunc<"MovePhase">, move: PokemonMove): void {
    this.dynamicQueueManager.setMoveForPhase(phaseCondition, move);
  }

  /**
   * Redirect moves which were targeted at a {@linkcode Pokemon} that has been removed
   * @param removedPokemon - The removed {@linkcode Pokemon}
   * @param allyPokemon - The ally of the removed pokemon
   */
  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    this.dynamicQueueManager.redirectMoves(removedPokemon, allyPokemon);
  }

  /** Queue phases which run at the end of each turn. */
  public queueTurnEndPhases(): void {
    turnEndPhases.forEach(p => {
      this.pushNew(p);
    });
  }

  /** Prevent end of turn effects from triggering when transitioning to a new biome on a X0 wave. */
  public onInterlude(): void {
    const phasesToRemove: readonly PhaseString[] = [
      "WeatherEffectPhase",
      "BerryPhase",
      "CheckStatusEffectPhase",
    ] as const;
    for (const phaseName of phasesToRemove) {
      this.phaseQueue.removeAll(phaseName);
    }

    const turnEndPhase = this.phaseQueue.find("TurnEndPhase");
    if (turnEndPhase) {
      turnEndPhase.upcomingInterlude = true;
    }
  }
  // #endregion Phase Functions
}
