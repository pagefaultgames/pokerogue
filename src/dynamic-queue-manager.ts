import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { MovePhase } from "#app/phases/move-phase";
import { MovePhasePriorityQueue } from "#app/queues/move-phase-priority-queue";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import { PostSummonPhasePriorityQueue } from "#app/queues/post-summon-phase-priority-queue";
import type { PriorityQueue } from "#app/queues/priority-queue";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { DynamicPhase, PhaseConditionFunc, PhaseString } from "#types/phase-types";

// TODO: might be easier to define which phases should be dynamic instead
/** All phases which have defined a `getPokemon` method but should not be sorted dynamically */
const nonDynamicPokemonPhases: readonly PhaseString[] = [
  "SummonPhase",
  "CommandPhase",
  "LearnMovePhase",
  "MoveEffectPhase",
  "MoveEndPhase",
  "FaintPhase",
  "DamageAnimPhase",
  "VictoryPhase",
  "PokemonHealPhase",
  "WeatherEffectPhase",
  "ShowAbilityPhase",
  "HideAbilityPhase",
  "ExpPhase",
  "ShowPartyExpBarPhase",
  "HidePartyExpBarPhase",
] as const;

/**
 * The dynamic queue manager holds priority queues for phases which are queued as dynamic.
 *
 * Dynamic phases are generally those which hold a pokemon and are unshifted, not pushed. \
 * Queues work by sorting their entries in speed order (and possibly with more complex ordering) before each time a phase is popped.
 *
 * As the holder, this structure is also used to access and modify queued phases.
 * This is mostly used in redirection, cancellation, etc. of {@linkcode MovePhase}s.
 */
export class DynamicQueueManager {
  /** A Map matching `Phase` names to their corresponding priority queuess */
  private readonly dynamicPhaseMap: Map<PhaseString, PriorityQueue<Phase>>;

  constructor() {
    this.dynamicPhaseMap = new Map();
    // PostSummon and Move phases have specialized queues
    this.dynamicPhaseMap.set("PostSummonPhase", new PostSummonPhasePriorityQueue());
    this.dynamicPhaseMap.set("MovePhase", new MovePhasePriorityQueue());
  }

  /** Remove all phases from the manager. */
  public clearQueues(): void {
    for (const queue of this.dynamicPhaseMap.values()) {
      queue.clear();
    }
    // TODO: Remove in a later PR - this is both unwieldly for tests
    // and would force MEs to reset the turn order at start of every single turn (which is dumb)
    globalScene.turnCommandManager.resetTurnOrder();
  }

  /**
   * Adds a new phase to the manager and creates the priority queue for it if one does not exist.
   * @param phase - The {@linkcode Phase} to add
   * @returns `true` if the phase was added, or `false` if it is not dynamic
   */
  public queueDynamicPhase(phase: Phase): boolean {
    if (!this.isDynamicPhase(phase)) {
      return false;
    }

    if (!this.dynamicPhaseMap.has(phase.phaseName)) {
      this.dynamicPhaseMap.set(phase.phaseName, new PokemonPhasePriorityQueue());
    }
    this.dynamicPhaseMap.get(phase.phaseName)?.push(phase);
    return true;
  }

  /**
   * Remove a {@linkcode Phase} from its corresponding queue and return it.
   * @param name - The {@linkcode PhaseString | name} of the Phase to retrieve
   * @returns The highest-priority `Phase` of the given type, or `undefined` if none of the specified type exist
   */
  public popNextPhase(name: PhaseString): Phase | undefined {
    return this.dynamicPhaseMap.get(name)?.pop();
  }

  /**
   * Determines if there is a queued dynamic {@linkcode Phase} meeting the conditions
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param condition - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a matching phase exists
   */
  public exists<T extends PhaseString>(name: T, condition: PhaseConditionFunc<T> = () => true): boolean {
    return !!this.dynamicPhaseMap.get(name)?.has(condition as (phase: Phase) => boolean);
  }

  /**
   * Finds and removes a single queued {@linkcode Phase}
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns Whether a removal occurred
   */
  public removePhase<T extends PhaseString>(name: T, condition: PhaseConditionFunc<T> = () => true): boolean {
    return !!this.dynamicPhaseMap.get(name)?.remove(condition as (phase: Phase) => boolean);
  }

  /**
   * Sets the timing modifier of a move (i.e. to force it first or last)
   * @param condition - A {@linkcode PhaseConditionFunc} to specify conditions for the move
   * @param modifier - The {@linkcode MovePhaseTimingModifier} to switch the move to
   */
  public setMoveTimingModifier(condition: PhaseConditionFunc<"MovePhase">, modifier: MovePhaseTimingModifier): void {
    this.getMovePhaseQueue().setTimingModifier(condition, modifier);
  }

  /**
   * Finds the {@linkcode MovePhase} meeting the condition and changes its move
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function
   * @param move - The {@linkcode PokemonMove | move} to use in replacement
   */
  public setMoveForPhase(condition: PhaseConditionFunc<"MovePhase">, move: PokemonMove): void {
    this.getMovePhaseQueue().setMoveForPhase(condition, move);
  }

  /**
   * Redirects moves which were targeted at a {@linkcode Pokemon} that has been removed
   * @param removedPokemon - The removed {@linkcode Pokemon}
   * @param allyPokemon - The ally of the removed pokemon
   */
  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    this.getMovePhaseQueue().redirectMoves(removedPokemon, allyPokemon);
  }

  /**
   * Find and return the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   * @returns The retrieved `MovePhase`, or `undefined` if none meet the criteria.
   */
  public getMovePhase(condition: PhaseConditionFunc<"MovePhase">): MovePhase | undefined {
    return this.getMovePhaseQueue().find(condition);
  }

  /**
   * Find and cancel the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   */
  public cancelMovePhase(condition: PhaseConditionFunc<"MovePhase">): void {
    this.getMovePhaseQueue().cancelMove(condition);
  }

  /**
   * @returns An in-order array of {@linkcode Pokemon}, representing the turn order as played out in the most recent turn
   */
  public getLastTurnOrder(): Pokemon[] {
    return this.getMovePhaseQueue().getTurnOrder();
  }

  /** Clears the stored `Move` turn order */
  public clearLastTurnOrder(): void {
    this.getMovePhaseQueue().clearTurnOrder();
  }

  /** Internal helper to get the {@linkcode MovePhasePriorityQueue} */
  private getMovePhaseQueue(): MovePhasePriorityQueue {
    return this.dynamicPhaseMap.get("MovePhase") as MovePhasePriorityQueue;
  }

  /**
   * Internal helper to determine if a phase is dynamic.
   * @param phase - The {@linkcode Phase} to check
   * @returns Whether `phase` is dynamic.
   * @privateRemarks
   * Currently, this checks that `phase` has a `getPokemon` method
   * and is not blacklisted in `nonDynamicPokemonPhases`.
   */
  private isDynamicPhase(phase: Phase): phase is DynamicPhase {
    return typeof (phase as any).getPokemon === "function" && !nonDynamicPokemonPhases.includes(phase.phaseName);
  }
}
