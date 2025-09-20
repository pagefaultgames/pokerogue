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
import { BattleType } from "#enums/battle-type";
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
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
import type { PhaseConditionFunc, PhaseMap, PhaseString } from "#types/phase-types";

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
const turnEndPhases: readonly PhaseString[] = [
  "WeatherEffectPhase",
  "PositionalTagPhase",
  "BerryPhase",
  "CheckStatusEffectPhase",
  "TurnEndPhase",
] as const;

/**
 * PhaseManager is responsible for managing the phases in the battle scene
 */
export class PhaseManager {
  /** PhaseQueue: dequeue/remove the first element to get the next phase */
  private readonly phaseQueue: PhaseTree = new PhaseTree();

  /** Holds priority queues for dynamically ordered phases */
  public dynamicQueueManager = new DynamicQueueManager();

  /** The currently-running phase */
  private currentPhase: Phase;
  /** The phase put on standby if {@linkcode overridePhase} is called */
  private standbyPhase: Phase | null = null;

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

  /** @returns The currently running {@linkcode Phase}. */
  getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Adds a phase to the end of the queue
   * @param phase - The {@linkcode Phase} to add
   */
  public pushPhase(phase: Phase): void {
    this.phaseQueue.pushPhase(this.checkDynamic(phase));
  }

  /**
   * Queue a phase to be run immediately after the current phase finishes. \
   * Unshifted phases are run in FIFO order if multiple are queued during a single phase's execution.
   * @param phase - The {@linkcode Phase} to add
   */
  public unshiftPhase(phase: Phase): void {
    const toAdd = this.checkDynamic(phase);
    phase.is("MovePhase") ? this.phaseQueue.addAfter(toAdd, "MoveEndPhase") : this.phaseQueue.addPhase(toAdd);
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
   * Clears the phaseQueue
   * @param leaveUnshifted - If `true`, leaves the top level of the tree intact; default `false`
   */
  public clearPhaseQueue(leaveUnshifted = false): void {
    this.phaseQueue.clear(leaveUnshifted);
  }

  /** Clears all phase queues and the standby phase */
  public clearAllPhases(): void {
    this.clearPhaseQueue();
    this.dynamicQueueManager.clearQueues();
    this.standbyPhase = null;
  }

  /**
   * Determines the next phase to run and starts it.
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
   */
  private startCurrentPhase(): void {
    console.log(`%cStart Phase ${this.currentPhase.phaseName}`, `color:${PHASE_START_COLOR};`);
    this.currentPhase.start();
  }

  /**
   * Overrides the currently running phase with another
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
   * @param type - The {@linkcode PhaseString | type} of phase to search for
   * @param condition - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a matching phase exists
   */
  public hasPhaseOfType<T extends PhaseString>(type: T, condition?: PhaseConditionFunc<T>): boolean {
    return this.dynamicQueueManager.exists(type, condition) || this.phaseQueue.exists(type, condition);
  }

  /**
   * Attempt to find and remove the first queued {@linkcode Phase} matching the given conditions.
   * @param type - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a phase was successfully removed
   */
  public tryRemovePhase<T extends PhaseString>(type: T, phaseFilter?: PhaseConditionFunc<T>): boolean {
    if (this.dynamicQueueManager.removePhase(type, phaseFilter)) {
      return true;
    }
    return this.phaseQueue.remove(type, phaseFilter);
  }

  /**
   * Removes all {@linkcode Phase}s of the given type from the queue
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   *
   * @remarks
   * This is not intended to be used with dynamically ordered phases, and does not operate on the dynamic queue. \
   * However, it does remove {@linkcode DynamicPhaseMarker}s and so would prevent such phases from activating.
   */
  public removeAllPhasesOfType(type: PhaseString): void {
    this.phaseQueue.removeAll(type);
  }

  /**
   * Adds a `MessagePhase` to the queue
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
   * Queues an ability bar flyout phase via {@linkcode unshiftPhase}
   * @param pokemon - The {@linkcode Pokemon} whose ability is being activated
   * @param passive - Whether the ability is a passive
   * @param show - If `true`, show the bar. Otherwise, hide it
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
   * Clear all dynamic queues and begin a new {@linkcode TurnInitPhase} for the new turn.
   * Called whenever the current phase queue is empty.
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

  /**
   * Add a {@linkcode FaintPhase} to the queue
   * @param args - The arguments to pass to the phase constructor
   *
   * @remarks
   *
   * Faint phases are ordered in a special way to allow battle effects to settle before the pokemon faints.
   * @see {@linkcode PhaseTree.addPhase}
   */
  public queueFaintPhase(...args: ConstructorParameters<PhaseConstructorMap["FaintPhase"]>): void {
    this.phaseQueue.addPhase(this.create("FaintPhase", ...args), true);
  }

  /**
   * Attempts to add {@linkcode PostSummonPhase}s for the enemy pokemon
   *
   * This is used to ensure that wild pokemon (which have no {@linkcode SummonPhase}) do not queue a {@linkcode PostSummonPhase}
   * until all pokemon are on the field.
   */
  public tryAddEnemyPostSummonPhases(): void {
    if (
      ![BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)
      && !this.phaseQueue.exists("SummonPhase")
    ) {
      globalScene.getEnemyField().forEach(p => {
        this.pushPhase(new PostSummonPhase(p.getBattlerIndex(), "SummonPhase"));
      });
    }
  }

  /**
   * Create a new phase and queue it to run after all others queued by the currently running phase.
   * @param phase - The name of the phase to create
   * @param args - The arguments to pass to the phase constructor
   *
   * @deprecated Only used for switches and should be phased out eventually.
   */
  public queueDeferred<const T extends "SwitchPhase" | "SwitchSummonPhase">(
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): void {
    this.phaseQueue.unshiftToCurrent(this.create(phase, ...args));
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
      this.pushNew(p);
    });
  }

  /** Prevents end of turn effects from triggering when transitioning to a new biome on a X0 wave */
  public onInterlude(): void {
    const phasesToRemove: readonly PhaseString[] = [
      "WeatherEffectPhase",
      "BerryPhase",
      "CheckStatusEffectPhase",
    ] as const;
    for (const phaseType of phasesToRemove) {
      this.phaseQueue.removeAll(phaseType);
    }

    const turnEndPhase = this.phaseQueue.find("TurnEndPhase");
    if (turnEndPhase) {
      turnEndPhase.upcomingInterlude = true;
    }
  }
}
