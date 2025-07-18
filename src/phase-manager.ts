import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { type PhasePriorityQueue, PostSummonPhasePriorityQueue } from "#data/phase-priority-queue";
import type { DynamicPhaseType } from "#enums/dynamic-phase-type";
import type { Pokemon } from "#field/pokemon";
import { ActivatePriorityQueuePhase } from "#phases/activate-priority-queue-phase";
import { AddEnemyBuffModifierPhase } from "#phases/add-enemy-buff-modifier-phase";
import { AttemptCapturePhase } from "#phases/attempt-capture-phase";
import { AttemptRunPhase } from "#phases/attempt-run-phase";
import { BattleEndPhase } from "#phases/battle-end-phase";
import { BerryPhase } from "#phases/berry-phase";
import { CheckStatusEffectPhase } from "#phases/check-status-effect-phase";
import { CheckSwitchPhase } from "#phases/check-switch-phase";
import { CommandPhase } from "#phases/command-phase";
import { CommonAnimPhase } from "#phases/common-anim-phase";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
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
import { PostGameOverPhase } from "#phases/post-game-over-phase";
import { PostSummonPhase } from "#phases/post-summon-phase";
import { PostTurnStatusEffectPhase } from "#phases/post-turn-status-effect-phase";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { ReloadSessionPhase } from "#phases/reload-session-phase";
import { ResetStatusPhase } from "#phases/reset-status-phase";
import { ReturnPhase } from "#phases/return-phase";
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
import { SummonMissingPhase } from "#phases/summon-missing-phase";
import { SummonPhase } from "#phases/summon-phase";
import { SwitchBiomePhase } from "#phases/switch-biome-phase";
import { SwitchPhase } from "#phases/switch-phase";
import { SwitchSummonPhase } from "#phases/switch-summon-phase";
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
import type { PhaseMap, PhaseString } from "#types/phase-types";
import { type Constructor, coerceArray } from "#utils/common";

/*
 * Manager for phases used by battle scene.
 *
 * *This file must not be imported or used directly. The manager is exclusively used by the battle scene and is not intended for external use.*
 */

/**
 * Object that holds all of the phase constructors.
 * This is used to create new phases dynamically using the `newPhase` method in the `PhaseManager`.
 *
 * @remarks
 * The keys of this object are the names of the phases, and the values are the constructors of the phases.
 * This allows for easy creation of new phases without needing to import each phase individually.
 */
const PHASES = Object.freeze({
  ActivatePriorityQueuePhase,
  AddEnemyBuffModifierPhase,
  AttemptCapturePhase,
  AttemptRunPhase,
  BattleEndPhase,
  BerryPhase,
  CheckStatusEffectPhase,
  CheckSwitchPhase,
  CommandPhase,
  CommonAnimPhase,
  DamageAnimPhase,
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
  PostGameOverPhase,
  PostSummonPhase,
  PostTurnStatusEffectPhase,
  QuietFormChangePhase,
  ReloadSessionPhase,
  ResetStatusPhase,
  ReturnPhase,
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
  SummonMissingPhase,
  SummonPhase,
  SwitchBiomePhase,
  SwitchPhase,
  SwitchSummonPhase,
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

/**
 * PhaseManager is responsible for managing the phases in the battle scene
 */
export class PhaseManager {
  /**
   * A queue of yet-unexecuted {@linkcode Phase}s to be run. \
   * Each time the current phase ends, all phases from {@linkcode phaseQueuePrepend} are added
   * to the front of this queue and the next phase is started.
   */
  public phaseQueue: Phase[] = [];
  /**
   * A queue of yet-unexecuted {@linkcode Phase}s with conditions for their execution. \
   * Each entry is evaluated whenever a new phase starts, being added to the {@linkcode phaseQueue} if the condition is satisfied.
   *
   */
  public conditionalQueue: Array<[condition: () => boolean, phase: Phase]> = [];
  /** A temporary storage of {@linkcode Phase}s */
  private phaseQueuePrepend: Phase[] = [];

  /**
   * If set, will cause subsequent calls to {@linkcode unshiftPhase} to insert phases at this index in **LIFO** order.
   * Useful for inserting Phases "out of order".
   *
   * Is cleared whenever a phase ends, or when {@linkcode clearPhaseQueueSplice} is called.
   * @defaultValue `-1`
   */
  private phaseQueuePrependSpliceIndex = -1;
  private nextCommandPhaseQueue: Phase[] = [];

  /** Storage for {@linkcode PhasePriorityQueue}s which hold phases whose order dynamically changes */
  private dynamicPhaseQueues: PhasePriorityQueue[];
  /** Parallel array to {@linkcode dynamicPhaseQueues} - matches phase types to their queues */
  private dynamicPhaseTypes: Constructor<Phase>[];

  /** The currently running Phase, or `null` if none have started yet. */
  private currentPhase: Phase | null = null;
  private standbyPhase: Phase | null = null;

  constructor() {
    this.dynamicPhaseQueues = [new PostSummonPhasePriorityQueue()];
    this.dynamicPhaseTypes = [PostSummonPhase];
  }

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

  /* Phase Functions */

  /**
   * Getter function to return the currently-in-progess {@linkcode Phase}.
   * @returns The current Phase, or `null` if no phase is currently running
   * (due to the PhaseManager not having been started yet).
   */
  // TODO: Investigate if we can drop the `null` from this - it is only ever `null` when the manager hasn't started
  // (which should never happen once the animations have loaded)
  getCurrentPhase(): Phase | null {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Adds a phase to the conditional queue and ensures it is executed only when the specified condition is met.
   *
   * This method allows deferring the execution of a phase until certain conditions are met, which is useful for handling
   * situations like abilities and entry hazards that depend on specific game states.
   *
   * @param phase - The {@linkcode Phase} to add to the conditional queue.
   * @param condition - A function that returns a boolean indicating whether the phase should be executed.
   */
  pushConditionalPhase(phase: Phase, condition: () => boolean): void {
    this.conditionalQueue.push([condition, phase]);
  }

  /**
   * Add a phase to the end of the {@linkcode phaseQueue}.
   * @param phase - The {@linkcode Phase} to be queued.
   * @param defer If `true`, will add the phase to {@linkcode nextCommandPhaseQueue} instead of the normal {@linkcode phaseQueue}; default `false`.
   */
  pushPhase(phase: Phase, defer = false): void {
    if (this.getDynamicPhaseType(phase) !== undefined) {
      this.pushDynamicPhase(phase);
    } else {
      (!defer ? this.phaseQueue : this.nextCommandPhaseQueue).push(phase);
    }
  }

  /**
   * Adds one or more phase(s) to the **END** of {@linkcode phaseQueuePrepend}.
   * If called multiple times, phases will be ran in **FIFO** order.
   * @param phases - One or more {@linkcode Phase}s to add.
   * @todo Find a better name for this given that "unshift" implies adding to the front.
   * @remarks
   * If {@linkcode phaseQueuePrependSpliceIndex} is set, the phases will be inserted at that index
   * in **LIFO** order.
   */
  unshiftPhase(...phases: Phase[]): void {
    if (this.phaseQueuePrependSpliceIndex === -1) {
      this.phaseQueuePrepend.push(...phases);
    } else {
      this.phaseQueuePrepend.splice(this.phaseQueuePrependSpliceIndex, 0, ...phases);
    }
  }

  /**
   * Clears the phaseQueue
   */
  clearPhaseQueue(): void {
    this.phaseQueue.splice(0, this.phaseQueue.length);
  }

  /**
   * Clears all phase-related stuff, including all phase queues, the current and standby phases, and splice index.
   */
  clearAllPhases(): void {
    this.clearPhaseQueue();
    for (const queue of [this.phaseQueuePrepend, this.conditionalQueue, this.nextCommandPhaseQueue]) {
      queue.splice(0, queue.length);
    }
    this.dynamicPhaseQueues.forEach(queue => {
      queue.clear();
    });
    this.currentPhase = null;
    this.standbyPhase = null;
    this.clearPhaseQueueSplice();
  }

  /**
   * Set {@linkcode phaseQueuePrependSpliceIndex} to the current length of {@linkcode phaseQueuePrepend},
   * causing subsequent calls to {@linkcode unshiftPhase} to insert phases in LIFO order.
   * @see {@linkcode clearPhaseQueueSplice} to clear queue splice
   */
  setPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = this.phaseQueuePrepend.length;
  }

  /**
   * Reset {@linkcode phaseQueuePrependSpliceIndex} to `-1`,
   * causing subsequent calls to {@linkcode unshiftPhase} to append phases at the end of {@linkcode phaseQueuePrepend}
   * in FIFO order.
   * @see {@linkcode setPhaseQueueSplice} to set queue splice
   * @remarks
   * Is called automatically upon phase end.
   */
  clearPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = -1;
  }

  /**
   * End the currently running phase and start the next one.
   * We dump everything from {@linkcode phaseQueuePrepend} to the start of {@linkcode phaseQueue},
   * then remove the first Phase and start it.
   * @remarks
   * Called by {@linkcode Phase.end} by default.
   */
  shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    this.clearPhaseQueueSplice();
    this.phaseQueue.unshift(...this.phaseQueuePrepend);
    this.phaseQueuePrepend = [];

    if (!this.phaseQueue.length) {
      this.populatePhaseQueue();
      // Clear the conditionalQueue if there are no phases left in the phaseQueue
      this.conditionalQueue = [];
    }

    const nextPhase = this.phaseQueue.shift();
    if (!nextPhase) {
      throw new Error("No phases in queue; aborting");
    }

    this.currentPhase = nextPhase;

    const unactivatedConditionalPhases: [() => boolean, Phase][] = [];
    // Check each queued conditional phase, either adding it to the end of the queue (if met)
    // or keeping it on (if not).
    for (const [condition, phase] of this.conditionalQueue) {
      if (condition()) {
        this.pushPhase(phase);
      } else {
        unactivatedConditionalPhases.push([condition, phase]);
      }
    }
    this.conditionalQueue = unactivatedConditionalPhases;

    console.log(`%cStart Phase ${this.currentPhase.phaseName}`, "color:green;");
    this.currentPhase.start();
  }

  // TODO: Review if we can remove this
  overridePhase(phase: Phase): boolean {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    console.log(`%cStart Phase ${phase.phaseName}`, "color:green;");
    phase.start();

    return true;
  }

  /**
   * Find a specific {@linkcode Phase} in the phase queue.
   *
   * @param phaseFilter - The predicate function to use to find a queued phase
   * @returns The first phase for which {@linkcode phaseFilter} returns `true`, or `undefined` if none match.
   */
  findPhase<P extends Phase = Phase>(phaseFilter: (phase: P) => boolean): P | undefined {
    return this.phaseQueue.find(phaseFilter) as P | undefined;
  }

  // TODO: This is used exclusively by encore
  tryReplacePhase(phaseFilter: (phase: Phase) => boolean, phaseTarget: Phase): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex === -1) {
      return false;
    }
    this.phaseQueue[phaseIndex] = phaseTarget;
    return true;
  }

  /**
   * Search for a specific phase in the {@linkcode phaseQueue} and remove the first matching result.
   * @param phaseFilter - The function to filter the phase queue by
   * @returns Whether a matching phase was found and removed.
   */
  tryRemovePhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex === -1) {
      return false;
    }
    this.phaseQueue.splice(phaseIndex, 1);
    return true;
  }

  /**
   * Search for a specific phase in {@linkcode phaseQueuePrepend} and remove the first matching result.
   * @param phaseFilter - The function to filter the phase queue by
   * @returns Whether a matching phase was found and removed.
   */
  tryRemoveUnshiftedPhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueuePrepend.findIndex(phaseFilter);
    if (phaseIndex === -1) {
      return false;
    }
    this.phaseQueuePrepend.splice(phaseIndex, 1);
    return true;
  }

  /**
   * Attempt to add {@linkcode phase} directly **before** the first instance of {@linkcode target} in the {@linkcode phaseQueue}.
   * If none are found, will call {@linkcode unshiftPhase()} to add the phase to the end of {@linkcode phaseQueuePrepend}.
   * @param phase - The {@linkcode Phase} (single or array) to add
   * @param targetPhase - The {@linkcode PhaseString | name} of the Phase to search for
   * @returns Whether a {@linkcode targetPhase} was found successfully.
   */
  prependToPhase(phase: Phase | Phase[], targetPhase: PhaseString): boolean {
    phase = coerceArray(phase);
    const target = PHASES[targetPhase];
    const targetIndex = this.phaseQueue.findIndex(ph => ph instanceof target);

    if (targetIndex > -1) {
      this.phaseQueue.splice(targetIndex, 0, ...phase);
      return true;
    }
    this.unshiftPhase(...phase);
    return false;
  }

  /**
   * Attempt to add {@linkcode phase} directly **after** the first instance of {@linkcode target} in the {@linkcode phaseQueue}.
   * If none are found, will call {@linkcode unshiftPhase()} to add the phase to the end of {@linkcode phaseQueuePrepend}.
   * @param phase - The {@linkcode Phase} (single or array) to add
   * @param targetPhase - The {@linkcode PhaseString | name} of the queued Phase to search for
   * @param condition - If provided, will only consider target phases passing the condition
   * @returns Whether a {@linkcode targetPhase} was found successfully
   */
  appendToPhase(phase: Phase | Phase[], targetPhase: PhaseString, condition?: (p: Phase) => boolean): boolean {
    phase = coerceArray(phase);
    const target = PHASES[targetPhase];
    const targetIndex = this.phaseQueue.findIndex(ph => ph instanceof target && (!condition || condition(ph)));

    if (targetIndex !== -1 && this.phaseQueue.length > targetIndex) {
      this.phaseQueue.splice(targetIndex + 1, 0, ...phase);
      return true;
    }
    this.unshiftPhase(...phase);
    return false;
  }

  /**
   * Check a phase and return its matching {@linkcode DynamicPhaseType}
   * @param phase - The {@linkcode Phase} to check
   * @returns The corresponding {@linkcode DynamicPhaseType}, or `undefined` if it lacks one.
   */
  public getDynamicPhaseType(phase: Phase | null): DynamicPhaseType | undefined {
    let phaseType: DynamicPhaseType | undefined;
    this.dynamicPhaseTypes.forEach((cls, index) => {
      if (phase instanceof cls) {
        phaseType = index;
      }
    });

    return phaseType;
  }

  /**
   * Unshift an {@linkcode ActivatePriorityQueuePhase} for {@linkcode phase}, then push {@linkcode phase}
   * onto its respective dynamic queue.
   *
   * The {@linkcode ActivatePriorityQueuePhase} will run the top phase in the queue (not necessarily {@linkcode phase})
   * each time a queued phase would otherwise execute.
   * @param phase - The {@linkcode Phase} to push
   * @see {@linkcode unshiftDynamicPhase} Similar method that unshifts instead of pushing
   */
  public pushDynamicPhase(phase: Phase): void {
    const type = this.getDynamicPhaseType(phase);
    if (type === undefined) {
      return;
    }

    this.pushPhase(new ActivatePriorityQueuePhase(type));
    this.dynamicPhaseQueues[type].push(phase);
  }

  /**
   * Unshifts the top phase from the corresponding dynamic queue onto {@linkcode phaseQueue}.
   * @param type - The {@linkcode DynamicPhaseType} corresponding to the dynamic phase being started
   */
  public startDynamicPhaseType(type: DynamicPhaseType): void {
    const phase = this.dynamicPhaseQueues[type].pop();
    if (phase) {
      this.unshiftPhase(phase);
    }
  }

  /**
   * Unshift an {@linkcode ActivatePriorityQueuePhase} for {@linkcode phase}, then push {@linkcode phase}
   * onto its respective dynamic queue.
   *
   * The {@linkcode ActivatePriorityQueuePhase} will run the top phase in the queue (not necessarily {@linkcode phase})
   * each time a queued phase would otherwise execute.
   *
   * @param phase - The {@linkcode Phase} to unshift
   * @see {@linkcode pushDynamicPhase} Similar method that pushes instead of unshifting
   * @todo - Consider renaming to `unshiftDymanicPhase`
   */
  public startDynamicPhase(phase: Phase): void {
    const type = this.getDynamicPhaseType(phase);
    if (type === undefined) {
      return;
    }

    this.unshiftPhase(new ActivatePriorityQueuePhase(type));
    this.dynamicPhaseQueues[type].push(phase);
  }

  /**
   * Adds a MessagePhase, either to PhaseQueuePrepend or nextCommandPhaseQueue
   * @param message - The message to be displayed.
   * @param callbackDelay - optional param for MessagePhase constructor
   * @param prompt - optional param for MessagePhase constructor
   * @param promptDelay - optional param for MessagePhase constructor
   * @param defer - Whether to allow the phase to be deferred
   *
   * @see {@linkcode MessagePhase} for more details on the parameters
   */
  public queueMessage(
    message: string,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
    defer?: boolean | null,
  ) {
    const phase = new MessagePhase(message, callbackDelay, prompt, promptDelay);
    if (!defer) {
      // adds to the end of PhaseQueuePrepend
      this.unshiftPhase(phase);
    } else {
      // remember that pushPhase adds it to nextCommandPhaseQueue
      this.pushPhase(phase);
    }
  }

  /**
   * Queue an ability bar flyout phase.
   * @param pokemon - The pokemon with the ability
   * @param passive - Whether the ability is a passive
   * @param show - Whether to show or hide the bar
   */
  public queueAbilityDisplay(pokemon: Pokemon, passive: boolean, show: boolean): void {
    this.unshiftPhase(show ? new ShowAbilityPhase(pokemon.getBattlerIndex(), passive) : new HideAbilityPhase());
    this.clearPhaseQueueSplice(); // TODO: Is this necessary?
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
   * Moves everything from nextCommandPhaseQueue to phaseQueue (keeping order),
   * then adds a new {@linkcode TurnInitPhase} to start a new turn.
   */
  private populatePhaseQueue(): void {
    if (this.nextCommandPhaseQueue.length) {
      this.phaseQueue.push(...this.nextCommandPhaseQueue);
      this.nextCommandPhaseQueue.splice(0, this.nextCommandPhaseQueue.length);
    }
    this.pushNew("TurnInitPhase");
  }

  /**
   * Dynamically create the named phase from the provided arguments.
   *
   * @remarks
   * Used to avoid importing each phase individually, allowing for dynamic creation of phases.
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   * @returns The requested phase instance.
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
   * Equivalent to calling {@linkcode create} immediately followed by {@linkcode pushPhase}.
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public pushNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.pushPhase(this.create(phase, ...args));
  }

  /**
   * Create a new phase and immediately unshift it to the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode unshiftPhase}.
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public unshiftNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.unshiftPhase(this.create(phase, ...args));
  }

  /**
   * Create a new phase and immediately prepend it to an existing phase in the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode prependToPhase}.
   * @param targetPhase - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   * @returns Whether a {@linkcode targetPhase} was found successfully.
   */
  public prependNewToPhase<T extends PhaseString>(
    targetPhase: PhaseString,
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): boolean {
    return this.prependToPhase(this.create(phase, ...args), targetPhase);
  }

  /**
   * Create a new phase and immediately append it to an existing phase in the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode appendToPhase}.
   * @param targetPhase - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   * @returns Whether a {@linkcode targetPhase} was found successfully.
   */
  public appendNewToPhase<T extends PhaseString>(
    targetPhase: PhaseString,
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): boolean {
    return this.appendToPhase(this.create(phase, ...args), targetPhase);
  }

  /**
   * Create a new dynamic phase, unshift a {@linkcode ActivatePriorityQueuePhase} for it,
   * then push it onto its corresponnding dynamic queue
   * Equivalent to calling {@linkcode create} followed by {@linkcode startDynamicPhase}.
   * @param phase - The {@linkcode PhaseString | name} of the Phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public startNewDynamicPhase<T extends PhaseString>(
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): void {
    this.startDynamicPhase(this.create(phase, ...args));
  }
}
