import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { PhaseTree } from "#app/phase-tree";
import { DynamicQueueManager } from "#app/queues/dynamic-queue-manager";
import { BattleType } from "#enums/battle-type";
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
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
import type { PhaseConditionFunc } from "#types/phase-condition";
import type { PhaseMap, PhaseString } from "#types/phase-types";

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

/** Phases pushed at the end of each {@linkcode TurnStartPhase} */
const turnEndPhases: PhaseString[] = ["WeatherEffectPhase", "BerryPhase", "CheckStatusEffectPhase", "TurnEndPhase"];

/**
 * PhaseManager is responsible for managing the phases in the battle scene
 */
export class PhaseManager {
  /** PhaseQueue: dequeue/remove the first element to get the next phase */
  private phaseQueue: PhaseTree = new PhaseTree();
  private nextCommandPhaseQueue: Phase[] = [];

  /** Holds priority queues for dynamically ordered phases */
  public dynamicQueueManager = new DynamicQueueManager();

  /** The currently-running phase */
  private currentPhase: Phase | null = null;
  /** The phase put on standby if {@linkcode overridePhase} is called */
  private standbyPhase: Phase | null = null;

  /* Phase Functions */
  getCurrentPhase(): Phase | null {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Adds a phase to the end of the queue
   * @param phase {@linkcode Phase} the phase to add
   */
  pushPhase(phase: Phase): void {
    this.phaseQueue.pushPhase(this.checkDynamic(phase));
  }

  /**
   * Adds a phase to be run immediately after the current phase finishes. Unshifted phases are run in FIFO order if multiple are queued during a single phase's execution
   * @param phase - {@linkcode Phase} the phase to add
   * @param defer - If `true` allow subsequently unshifted phases to run before this one. Default `false`
   */
  unshiftPhase(phase: Phase, defer = false): void {
    const toAdd = this.checkDynamic(phase);
    phase.is("MovePhase") ? this.phaseQueue.addAfter(toAdd, "MoveEndPhase") : this.phaseQueue.addPhase(toAdd, defer);
  }

  /**
   * Helper method to queue a phase as dynamic if necessary
   * @param phase - The phase to check
   * @returns The {@linkcode phase} or a {@linkcode DynamicPhaseMarker} to be used in its place
   */
  private checkDynamic(phase: Phase): Phase {
    if (this.dynamicQueueManager.queueDynamicPhase(phase)) {
      return new DynamicPhaseMarker(phase.phaseName);
    }
    return phase;
  }

  /**
   * Clears the phaseQueue
   * @param leaveUnshifted - If `true`, leaves the top level of the tree intact
   */
  clearPhaseQueue(leaveUnshifted = false): void {
    this.phaseQueue.clear(leaveUnshifted);
  }

  /**
   * Clears all phase-related stuff, including all phase queues, the current and standby phases, and a splice index
   */
  clearAllPhases(): void {
    this.clearPhaseQueue();
    this.dynamicQueueManager.clearQueues();
    this.currentPhase = null;
    this.standbyPhase = null;
  }

  /**
   * Is called by {@linkcode Phase.end} by default. Determines and starts the next phase to run
   */
  shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    this.currentPhase = this.phaseQueue.getNextPhase() ?? null;

    if (this.currentPhase?.is("DynamicPhaseMarker")) {
      this.currentPhase = this.dynamicQueueManager.popNextPhase(this.currentPhase.phaseType) ?? null;
    }

    if (this.currentPhase === null) {
      this.turnStart();
    }

    if (this.currentPhase) {
      console.log(`%cStart Phase ${this.currentPhase.constructor.name}`, "color:green;");
      this.currentPhase.start();
    }
  }

  /**
   * Overrides the currently running phase with another
   * @param phase - The {@linkcode Phase} to override the current one with
   * @returns If the override succeeded
   *
   * @todo This is antithetical to the phase structure and used a single time. Remove it.
   */
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
   * Determines if there is a queued {@linkcode Phase} meeting the conditions
   * @param type - The {@linkcode PhaseString | type} of phase to search for
   * @param condition - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns `true` if a matching phase exists, `false` otherwise
   */
  public hasPhaseOfType<T extends PhaseString>(type: T, condition?: PhaseConditionFunc<T>): boolean {
    return this.dynamicQueueManager.exists(type, condition) || this.phaseQueue.exists(type, condition);
  }

  /**
   * Finds and removes a single queued {@linkcode Phase}
   * @param type - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - A {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns `true` if a removal occurred, `false` otherwise
   */
  tryRemovePhase<T extends PhaseString>(type: T, phaseFilter?: PhaseConditionFunc<T>): boolean {
    if (this.dynamicQueueManager.removePhase(type, phaseFilter)) {
      return true;
    }
    return this.phaseQueue.remove(type, phaseFilter);
  }

  /**
   * Removes all occurrences of {@linkcode Phase}s of the given type
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   *
   * @remarks
   * This is not intended to be used with dynamically ordered phases, and does not operate on the dynamic queue.
   * However, it does remove {@linkcode DynamicPhaseMarker}s and so would prevent such phases from activating.
   */
  public removeAllPhasesOfType(type: PhaseString): void {
    this.phaseQueue.removeAll(type);
  }

  /**
   * TODO this is obviously not what this does anymore. Need to rename and ensure callsites behave as expected
   */
  prependToPhase(phase: Phase, _targetPhase: PhaseString): void {
    this.phaseQueue.unshiftToCurrent(phase);
  }

  /**
   * Adds a MessagePhase, either to PhaseQueuePrepend
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
   * Clears dynamic queues and begins a new {@linkcode TurnInitPhase}
   */
  private turnStart(): void {
    this.dynamicQueueManager.clearQueues();
    this.currentPhase = new TurnInitPhase();
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

  // Not used yet
  public unshiftNewDeferred<T extends PhaseString>(
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): void {
    this.unshiftPhase(this.create(phase, ...args), true);
  }

  public tryAddEnemyPostSummonPhases(): void {
    if (
      ![BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType) &&
      !this.phaseQueue.exists("SummonPhase")
    ) {
      globalScene.getEnemyField().map(p => this.unshiftPhase(new PostSummonPhase(p.getBattlerIndex())));
    }
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
  ): void {
    this.prependToPhase(this.create(phase, ...args), targetPhase);
  }

  /**
   * Finds the first {@linkcode MovePhase} meeting the condition
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   * @returns The MovePhase, or `undefined` if it does not exist
   */
  public getMovePhase(phaseCondition: PhaseConditionFunc<"MovePhase">): MovePhase | undefined {
    return this.dynamicQueueManager.getMovePhase(phaseCondition);
  }

  /**
   * Finds and cancels the first {@linkcode MovePhase} meeting the condition
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   */
  public cancelMove(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.cancelMovePhase(phaseCondition);
  }

  /**
   * Finds the first {@linkcode MovePhase} meeting the condition and forces it next
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   */
  public forceMoveNext(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.FIRST);
  }

  /**
   * Finds the first {@linkcode MovePhase} meeting the condition and forces it last
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   */
  public forceMoveLast(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.LAST);
  }

  /**
   * Finds the first {@linkcode MovePhase} meeting the condition and changes its move
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   * @param move - The {@linkcode PokemonMove | move} to use in replacement
   */
  public changePhaseMove(phaseCondition: PhaseConditionFunc<"MovePhase">, move: PokemonMove): void {
    this.dynamicQueueManager.setMoveForPhase(phaseCondition, move);
  }

  /**
   * Redirects moves which were targeted at a {@linkcode Pokemon} that has been removed
   * @param removedPokemon - The removed {@linkcode Pokemon}
   * @param allyPokemon - The ally of the removed pokemon
   */
  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    this.dynamicQueueManager.redirectMoves(removedPokemon, allyPokemon);
  }

  /** Queues phases which run at the end of each turn */
  public queueTurnEndPhases(): void {
    turnEndPhases.forEach(p => {
      this.phaseQueue.pushPhase(this.create(p));
    });
  }
}
