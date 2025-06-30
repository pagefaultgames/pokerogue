import type { Phase } from "#app/phase";
import type { default as Pokemon } from "#app/field/pokemon";
import type { PhaseMap, PhaseString } from "./@types/phase-types";
import { globalScene } from "#app/global-scene";
import { ActivatePriorityQueuePhase } from "#app/phases/activate-priority-queue-phase";
import { AddEnemyBuffModifierPhase } from "#app/phases/add-enemy-buff-modifier-phase";
import { AttemptCapturePhase } from "#app/phases/attempt-capture-phase";
import { AttemptRunPhase } from "#app/phases/attempt-run-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { BerryPhase } from "#app/phases/berry-phase";
import { CheckStatusEffectPhase } from "#app/phases/check-status-effect-phase";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { CommonAnimPhase } from "#app/phases/common-anim-phase";
import { coerceArray, type Constructor } from "#app/utils/common";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import type { DynamicPhaseType } from "#enums/dynamic-phase-type";
import { EggHatchPhase } from "#app/phases/egg-hatch-phase";
import { EggLapsePhase } from "#app/phases/egg-lapse-phase";
import { EggSummaryPhase } from "#app/phases/egg-summary-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EndCardPhase } from "#app/phases/end-card-phase";
import { EndEvolutionPhase } from "#app/phases/end-evolution-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { EvolutionPhase } from "#app/phases/evolution-phase";
import { ExpPhase } from "#app/phases/exp-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { FormChangePhase } from "#app/phases/form-change-phase";
import { GameOverModifierRewardPhase } from "#app/phases/game-over-modifier-reward-phase";
import { GameOverPhase } from "#app/phases/game-over-phase";
import { HideAbilityPhase } from "#app/phases/hide-ability-phase";
import { HidePartyExpBarPhase } from "#app/phases/hide-party-exp-bar-phase";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { LevelCapPhase } from "#app/phases/level-cap-phase";
import { LevelUpPhase } from "#app/phases/level-up-phase";
import { LoadMoveAnimPhase } from "#app/phases/load-move-anim-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import { MoneyRewardPhase } from "#app/phases/money-reward-phase";
import { MoveAnimPhase } from "#app/phases/move-anim-phase";
import { MoveChargePhase } from "#app/phases/move-charge-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { MoveHeaderPhase } from "#app/phases/move-header-phase";
import { MovePhase } from "#app/phases/move-phase";
import {
  MysteryEncounterPhase,
  MysteryEncounterOptionSelectedPhase,
  MysteryEncounterBattlePhase,
  MysteryEncounterRewardsPhase,
  PostMysteryEncounterPhase,
  MysteryEncounterBattleStartCleanupPhase,
} from "#app/phases/mystery-encounter-phases";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { NewBiomeEncounterPhase } from "#app/phases/new-biome-encounter-phase";
import { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import { ObtainStatusEffectPhase } from "#app/phases/obtain-status-effect-phase";
import { PartyExpPhase } from "#app/phases/party-exp-phase";
import { PartyHealPhase } from "#app/phases/party-heal-phase";
import { type PhasePriorityQueue, PostSummonPhasePriorityQueue } from "#app/data/phase-priority-queue";
import { PokemonAnimPhase } from "#app/phases/pokemon-anim-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { PokemonTransformPhase } from "#app/phases/pokemon-transform-phase";
import { PostGameOverPhase } from "#app/phases/post-game-over-phase";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { PostTurnStatusEffectPhase } from "#app/phases/post-turn-status-effect-phase";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { ReloadSessionPhase } from "#app/phases/reload-session-phase";
import { ResetStatusPhase } from "#app/phases/reset-status-phase";
import { ReturnPhase } from "#app/phases/return-phase";
import { RevivalBlessingPhase } from "#app/phases/revival-blessing-phase";
import { RibbonModifierRewardPhase } from "#app/phases/ribbon-modifier-reward-phase";
import { ScanIvsPhase } from "#app/phases/scan-ivs-phase";
import { SelectBiomePhase } from "#app/phases/select-biome-phase";
import { SelectChallengePhase } from "#app/phases/select-challenge-phase";
import { SelectGenderPhase } from "#app/phases/select-gender-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { SelectTargetPhase } from "#app/phases/select-target-phase";
import { ShinySparklePhase } from "#app/phases/shiny-sparkle-phase";
import { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import { ShowPartyExpBarPhase } from "#app/phases/show-party-exp-bar-phase";
import { ShowTrainerPhase } from "#app/phases/show-trainer-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { SummonMissingPhase } from "#app/phases/summon-missing-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { SwitchBiomePhase } from "#app/phases/switch-biome-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { TeraPhase } from "#app/phases/tera-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import { TrainerVictoryPhase } from "#app/phases/trainer-victory-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { UnavailablePhase } from "#app/phases/unavailable-phase";
import { UnlockPhase } from "#app/phases/unlock-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { WeatherEffectPhase } from "#app/phases/weather-effect-phase";

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
  /** PhaseQueue: dequeue/remove the first element to get the next phase */
  public phaseQueue: Phase[] = [];
  public conditionalQueue: Array<[() => boolean, Phase]> = [];
  /** PhaseQueuePrepend: is a temp storage of what will be added to PhaseQueue */
  private phaseQueuePrepend: Phase[] = [];

  /** overrides default of inserting phases to end of phaseQueuePrepend array. Useful for inserting Phases "out of order" */
  private phaseQueuePrependSpliceIndex = -1;
  private nextCommandPhaseQueue: Phase[] = [];

  /** Storage for {@linkcode PhasePriorityQueue}s which hold phases whose order dynamically changes */
  private dynamicPhaseQueues: PhasePriorityQueue[];
  /** Parallel array to {@linkcode dynamicPhaseQueues} - matches phase types to their queues */
  private dynamicPhaseTypes: Constructor<Phase>[];

  private currentPhase: Phase | null = null;
  private standbyPhase: Phase | null = null;

  constructor() {
    this.dynamicPhaseQueues = [new PostSummonPhasePriorityQueue()];
    this.dynamicPhaseTypes = [PostSummonPhase];
  }

  /* Phase Functions */
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
   * @param phase - The phase to be added to the conditional queue.
   * @param condition - A function that returns a boolean indicating whether the phase should be executed.
   *
   */
  pushConditionalPhase(phase: Phase, condition: () => boolean): void {
    this.conditionalQueue.push([condition, phase]);
  }

  /**
   * Adds a phase to nextCommandPhaseQueue, as long as boolean passed in is false
   * @param phase {@linkcode Phase} the phase to add
   * @param defer boolean on which queue to add to, defaults to false, and adds to phaseQueue
   */
  pushPhase(phase: Phase, defer = false): void {
    if (this.getDynamicPhaseType(phase) !== undefined) {
      this.pushDynamicPhase(phase);
    } else {
      (!defer ? this.phaseQueue : this.nextCommandPhaseQueue).push(phase);
    }
  }

  /**
   * Adds Phase(s) to the end of phaseQueuePrepend, or at phaseQueuePrependSpliceIndex
   * @param phases {@linkcode Phase} the phase(s) to add
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
   * Clears all phase-related stuff, including all phase queues, the current and standby phases, and a splice index
   */
  clearAllPhases(): void {
    for (const queue of [this.phaseQueue, this.phaseQueuePrepend, this.conditionalQueue, this.nextCommandPhaseQueue]) {
      queue.splice(0, queue.length);
    }
    this.dynamicPhaseQueues.forEach(queue => queue.clear());
    this.currentPhase = null;
    this.standbyPhase = null;
    this.clearPhaseQueueSplice();
  }

  /**
   * Used by function unshiftPhase(), sets index to start inserting at current length instead of the end of the array, useful if phaseQueuePrepend gets longer with Phases
   */
  setPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = this.phaseQueuePrepend.length;
  }

  /**
   * Resets phaseQueuePrependSpliceIndex to -1, implies that calls to unshiftPhase will insert at end of phaseQueuePrepend
   */
  clearPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = -1;
  }

  /**
   * Is called by each Phase implementations "end()" by default
   * We dump everything from phaseQueuePrepend to the start of of phaseQueue
   * then removes first Phase and starts it
   */
  shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    if (this.phaseQueuePrependSpliceIndex > -1) {
      this.clearPhaseQueueSplice();
    }
    if (this.phaseQueuePrepend.length) {
      while (this.phaseQueuePrepend.length) {
        const poppedPhase = this.phaseQueuePrepend.pop();
        if (poppedPhase) {
          this.phaseQueue.unshift(poppedPhase);
        }
      }
    }
    if (!this.phaseQueue.length) {
      this.populatePhaseQueue();
      // Clear the conditionalQueue if there are no phases left in the phaseQueue
      this.conditionalQueue = [];
    }

    this.currentPhase = this.phaseQueue.shift() ?? null;

    const unactivatedConditionalPhases: [() => boolean, Phase][] = [];
    // Check if there are any conditional phases queued
    while (this.conditionalQueue?.length) {
      // Retrieve the first conditional phase from the queue
      const conditionalPhase = this.conditionalQueue.shift();
      // Evaluate the condition associated with the phase
      if (conditionalPhase?.[0]()) {
        // If the condition is met, add the phase to the phase queue
        this.pushPhase(conditionalPhase[1]);
      } else if (conditionalPhase) {
        // If the condition is not met, re-add the phase back to the front of the conditional queue
        unactivatedConditionalPhases.push(conditionalPhase);
      } else {
        console.warn("condition phase is undefined/null!", conditionalPhase);
      }
    }
    this.conditionalQueue.push(...unactivatedConditionalPhases);

    if (this.currentPhase) {
      console.log(`%cStart Phase ${this.currentPhase.constructor.name}`, "color:green;");
      this.currentPhase.start();
    }
  }

  overridePhase(phase: Phase): boolean {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    console.log(`%cStart Phase ${phase.constructor.name}`, "color:green;");
    phase.start();

    return true;
  }

  /**
   * Find a specific {@linkcode Phase} in the phase queue.
   *
   * @param phaseFilter filter function to use to find the wanted phase
   * @returns the found phase or undefined if none found
   */
  findPhase<P extends Phase = Phase>(phaseFilter: (phase: P) => boolean): P | undefined {
    return this.phaseQueue.find(phaseFilter) as P | undefined;
  }

  tryReplacePhase(phaseFilter: (phase: Phase) => boolean, phase: Phase): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue[phaseIndex] = phase;
      return true;
    }
    return false;
  }

  tryRemovePhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Will search for a specific phase in {@linkcode phaseQueuePrepend} via filter, and remove the first result if a match is found.
   * @param phaseFilter filter function
   */
  tryRemoveUnshiftedPhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueuePrepend.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueuePrepend.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Tries to add the input phase to index before target phase in the phaseQueue, else simply calls unshiftPhase()
   * @param phase - The phase to be added
   * @param targetPhase - The phase to search for in phaseQueue
   * @returns boolean if a targetPhase was found and added
   */
  prependToPhase(phase: Phase | Phase[], targetPhase: PhaseString): boolean {
    phase = coerceArray(phase);
    const target = PHASES[targetPhase];
    const targetIndex = this.phaseQueue.findIndex(ph => ph instanceof target);

    if (targetIndex !== -1) {
      this.phaseQueue.splice(targetIndex, 0, ...phase);
      return true;
    }
    this.unshiftPhase(...phase);
    return false;
  }

  /**
   * Tries to add the input phase(s) to index after target phase in the {@linkcode phaseQueue}, else simply calls {@linkcode unshiftPhase()}
   * @param phase {@linkcode Phase} the phase(s) to be added
   * @param targetPhase {@linkcode Phase} the type of phase to search for in {@linkcode phaseQueue}
   * @param condition Condition the target phase must meet to be appended to
   * @returns `true` if a `targetPhase` was found to append to
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
   * Checks a phase and returns the matching {@linkcode DynamicPhaseType}, or undefined if it does not match one
   * @param phase The phase to check
   * @returns The corresponding {@linkcode DynamicPhaseType} or `undefined`
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
   * Pushes a phase onto its corresponding dynamic queue and marks the activation point in {@linkcode phaseQueue}
   *
   * The {@linkcode ActivatePriorityQueuePhase} will run the top phase in the dynamic queue (not necessarily {@linkcode phase})
   * @param phase The phase to push
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
   * Unshifts the top phase from the corresponding dynamic queue onto {@linkcode phaseQueue}
   * @param type {@linkcode DynamicPhaseType} The type of dynamic phase to start
   */
  public startDynamicPhaseType(type: DynamicPhaseType): void {
    const phase = this.dynamicPhaseQueues[type].pop();
    if (phase) {
      this.unshiftPhase(phase);
    }
  }

  /**
   * Unshifts an {@linkcode ActivatePriorityQueuePhase} for {@linkcode phase}, then pushes {@linkcode phase} to its dynamic queue
   *
   * This is the same as {@linkcode pushDynamicPhase}, except the activation phase is unshifted
   *
   * {@linkcode phase} is not guaranteed to be the next phase from the queue to run (if the queue is not empty)
   * @param phase The phase to add
   * @returns
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
   * @param message - string for MessagePhase
   * @param callbackDelay - optional param for MessagePhase constructor
   * @param prompt - optional param for MessagePhase constructor
   * @param promptDelay - optional param for MessagePhase constructor
   * @param defer - Whether to allow the phase to be deferred
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
    if (!defer) {
      // adds to the end of PhaseQueuePrepend
      this.unshiftPhase(phase);
    } else {
      //remember that pushPhase adds it to nextCommandPhaseQueue
      this.pushPhase(phase);
    }
  }

  /**
   * Queues an ability bar flyout phase
   * @param pokemon The pokemon who has the ability
   * @param passive Whether the ability is a passive
   * @param show Whether to show or hide the bar
   */
  public queueAbilityDisplay(pokemon: Pokemon, passive: boolean, show: boolean): void {
    this.unshiftPhase(show ? new ShowAbilityPhase(pokemon.getBattlerIndex(), passive) : new HideAbilityPhase());
    this.clearPhaseQueueSplice();
  }

  /**
   * Hides the ability bar if it is currently visible
   */
  public hideAbilityBar(): void {
    if (globalScene.abilityBar.isVisible()) {
      this.unshiftPhase(new HideAbilityPhase());
    }
  }

  /**
   * Moves everything from nextCommandPhaseQueue to phaseQueue (keeping order)
   */
  private populatePhaseQueue(): void {
    if (this.nextCommandPhaseQueue.length) {
      this.phaseQueue.push(...this.nextCommandPhaseQueue);
      this.nextCommandPhaseQueue.splice(0, this.nextCommandPhaseQueue.length);
    }
    this.phaseQueue.push(new TurnInitPhase());
  }

  /**
   * Dynamically create the named phase from the provided arguments
   *
   * @remarks
   * Used to avoid importing each phase individually, allowing for dynamic creation of phases.
   * @param phase - The name of the phase to create.
   * @param args - The arguments to pass to the phase constructor.
   * @returns The requested phase instance
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
   * Create a new phase and immediately push it to the phase queue. Equivalent to calling {@linkcode create} followed by {@linkcode pushPhase}.
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public pushNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.pushPhase(this.create(phase, ...args));
  }

  /**
   * Create a new phase and immediately unshift it to the phase queue. Equivalent to calling {@linkcode create} followed by {@linkcode unshiftPhase}.
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   */
  public unshiftNew<T extends PhaseString>(phase: T, ...args: ConstructorParameters<PhaseConstructorMap[T]>): void {
    this.unshiftPhase(this.create(phase, ...args));
  }

  /**
   * Create a new phase and immediately prepend it to an existing phase in the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode prependToPhase}.
   * @param targetPhase - The phase to search for in phaseQueue
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   * @returns `true` if a `targetPhase` was found to prepend to
   */
  public prependNewToPhase<T extends PhaseString>(
    targetPhase: PhaseString,
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): boolean {
    return this.prependToPhase(this.create(phase, ...args), targetPhase);
  }

  /**
   * Create a new phase and immediately append it to an existing phase the phase queue.
   * Equivalent to calling {@linkcode create} followed by {@linkcode appendToPhase}.
   * @param targetPhase - The phase to search for in phaseQueue
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   * @returns `true` if a `targetPhase` was found to append to
   */
  public appendNewToPhase<T extends PhaseString>(
    targetPhase: PhaseString,
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): boolean {
    return this.appendToPhase(this.create(phase, ...args), targetPhase);
  }

  public startNewDynamicPhase<T extends PhaseString>(
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): void {
    this.startDynamicPhase(this.create(phase, ...args));
  }
}
