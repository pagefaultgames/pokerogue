import type { Phase } from "#app/phase";
import type { default as Pokemon } from "#app/field/pokemon";
import type { PhaseMap, PhaseString, StaticPhaseString } from "./@types/phase-types";
import { globalScene } from "#app/global-scene";
import { AddEnemyBuffModifierPhase } from "#app/phases/add-enemy-buff-modifier-phase";
import { AttemptCapturePhase } from "#app/phases/attempt-capture-phase";
import { AttemptRunPhase } from "#app/phases/attempt-run-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { BerryPhase } from "#app/phases/berry-phase";
import { CheckStatusEffectPhase } from "#app/phases/check-status-effect-phase";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { CommonAnimPhase } from "#app/phases/common-anim-phase";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
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
import { DynamicQueueManager } from "#app/queues/dynamic-queue-manager";
import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import { StaticSwitchSummonPhase } from "#app/phases/static-switch-summon-phase";
import { DynamicPhaseMarker } from "#app/phases/dynamic-phase-marker";
import { PhaseTree } from "#app/phase-tree";

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
  StaticSwitchSummonPhase,
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

const turnEndPhases: PhaseString[] = ["WeatherEffectPhase", "BerryPhase", "CheckStatusEffectPhase", "TurnEndPhase"];

/**
 * PhaseManager is responsible for managing the phases in the battle scene
 */
export class PhaseManager {
  /** PhaseQueue: dequeue/remove the first element to get the next phase */
  private phaseQueue: PhaseTree = new PhaseTree();
  private nextCommandPhaseQueue: Phase[] = [];

  public dynamicQueueManager = new DynamicQueueManager();

  private currentPhase: Phase | null = null;
  private standbyPhase: Phase | null = null;

  public turnEnded = false;

  /* Phase Functions */
  getCurrentPhase(): Phase | null {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Adds a phase to nextCommandPhaseQueue, as long as boolean passed in is false
   * @param phase {@linkcode Phase} the phase to add
   * @param defer boolean on which queue to add to, defaults to false, and adds to phaseQueue
   */
  pushPhase(phase: Phase, _defer = false): void {
    this.phaseQueue.pushPhase(phase);
  }

  /**
   * Adds Phase(s) to the end of phaseQueuePrepend, or at phaseQueuePrependSpliceIndex
   * @param phases {@linkcode Phase} the phase(s) to add
   */
  unshiftPhase(...phases: Phase[]): void {
    phases.forEach(p => {
      this.phaseQueue.addPhase(p);
    });
  }

  /**
   * Clears the phaseQueue
   */
  clearPhaseQueue(): void {
    this.phaseQueue.clear();
  }

  /**
   * Clears all phase-related stuff, including all phase queues, the current and standby phases, and a splice index
   */
  clearAllPhases(): void {
    this.clearPhaseQueue();
    this.dynamicQueueManager.clearQueues();
    this.currentPhase = null;
    this.standbyPhase = null;
    this.turnEnded = false;
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

    this.currentPhase = this.phaseQueue.getNextPhase() ?? null;

    if (this.currentPhase === null) {
      this.turnEndSequence();
    }

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

  public hasPhaseOfType<T extends PhaseString>(type: T, condition?: (phase: PhaseMap[T]) => boolean): boolean {
    return this.dynamicQueueManager.exists(type, condition) || this.phaseQueue.exists(type, condition);
  }

  tryRemovePhase<T extends PhaseString>(type: T, phaseFilter: PhaseConditionFunc<T>): boolean {
    if (this.dynamicQueueManager.removePhase(type, phaseFilter)) {
      return true;
    }
    return this.phaseQueue.remove(type, phaseFilter);
  }

  public removeAllPhasesOfType(type: PhaseString): void {
    this.phaseQueue.removeAll(type);
  }

  /**
   * Tries to add the input phase to index before target phase in the phaseQueue, else simply calls unshiftPhase()
   * @param phase - The phase to be added
   * @param targetPhase - The phase to search for in phaseQueue
   * @returns boolean if a targetPhase was found and added
   */
  prependToPhase(phase: Phase, _targetPhase: StaticPhaseString): void {
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
   * Moves everything from nextCommandPhaseQueue to phaseQueue (keeping order)
   */
  private turnEndSequence(): void {
    this.turnEnded = true;
    this.dynamicQueueManager.clearQueues();
    this.phaseQueue.pushPhase(new TurnInitPhase());
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
    targetPhase: StaticPhaseString,
    phase: T,
    ...args: ConstructorParameters<PhaseConstructorMap[T]>
  ): void {
    this.prependToPhase(this.create(phase, ...args), targetPhase);
  }

  public getMovePhase(phaseCondition: PhaseConditionFunc<"MovePhase">): MovePhase | undefined {
    return this.dynamicQueueManager.getMovePhase(phaseCondition);
  }

  public cancelMove(phaseCondition: PhaseConditionFunc<"MovePhase">): void {
    this.dynamicQueueManager.cancelMovePhase(phaseCondition);
  }

  public forceMoveNext(phaseCondition: PhaseConditionFunc<"MovePhase">) {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.FIRST);
  }

  public forceMoveLast(phaseCondition: PhaseConditionFunc<"MovePhase">) {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.LAST);
  }

  public changePhaseMove(phaseCondition: PhaseConditionFunc<"MovePhase">, move: PokemonMove) {
    this.dynamicQueueManager.setMoveForPhase(phaseCondition, move);
  }

  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    this.dynamicQueueManager.redirectMoves(removedPokemon, allyPokemon);
  }

  public queueTurnEndPhases(): void {
    turnEndPhases.forEach(p => {
      this.phaseQueue.pushPhase(this.create(p));
    });
  }
}
