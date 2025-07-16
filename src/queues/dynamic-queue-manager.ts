import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { PhaseString, DynamicPhase } from "#app/@types/phase-types";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type Pokemon from "#app/field/pokemon";
import type { Phase } from "#app/phase";
import type { MovePhase } from "#app/phases/move-phase";
import { MovePhasePriorityQueue } from "#app/queues/move-phase-priority-queue";
import type { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import { PostSummonPhasePriorityQueue } from "#app/queues/post-summon-phase-priority-queue";
import { SwitchSummonPhasePriorityQueue } from "#app/queues/switch-summon-phase-priority-queue";
import type { BattlerIndex } from "#enums/battler-index";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";

// TODO might be easier to define which phases should be dynamic instead
const nonDynamicPokemonPhases: PhaseString[] = ["SummonPhase", "CommandPhase", "LearnMovePhase"];

export class DynamicQueueManager {
  private dynamicPhaseMap: Map<PhaseString, PhasePriorityQueue<Phase>>;
  private alwaysDynamic: PhaseString[] = ["SwitchSummonPhase", "PostSummonPhase", "MovePhase"];

  constructor() {
    this.dynamicPhaseMap = new Map();
    this.dynamicPhaseMap.set("SwitchSummonPhase", new SwitchSummonPhasePriorityQueue());
    this.dynamicPhaseMap.set("PostSummonPhase", new PostSummonPhasePriorityQueue());
    this.dynamicPhaseMap.set("MovePhase", new MovePhasePriorityQueue());
  }

  public clearQueues(): void {
    for (const queue of this.dynamicPhaseMap.values()) {
      queue.clear();
    }
  }

  public queueDynamicPhase<T extends Phase>(phase: T): boolean {
    if (!this.isDynamicPhase(phase)) {
      return false;
    }

    if (!this.dynamicPhaseMap.has(phase.phaseName)) {
      // TS can't figure out that T is dynamic at this point, but it does know that `typeof phase` is
      this.dynamicPhaseMap.set(phase.phaseName, new PokemonPhasePriorityQueue<typeof phase>());
    }
    this.dynamicPhaseMap.get(phase.phaseName)?.push(phase);
    return true;
  }

  public popNextPhase(type: PhaseString): Phase | undefined {
    if (!this.alwaysDynamic.includes(type)) {
      return this.dynamicPhaseMap.get(type)?.pop();
    }
    return this.alwaysDynamic
      .map((p: PhaseString) => this.dynamicPhaseMap.get(p))
      .find(q => q && !q.isEmpty())
      ?.pop();
  }

  public findPhaseOfType<T extends PhaseString>(type: T, condition?: PhaseConditionFunc<T>): Phase | undefined {
    return this.dynamicPhaseMap.get(type)?.findPhase(condition);
  }

  public activeQueueExists(type: PhaseString) {
    return this.alwaysDynamic.includes(type) || this.dynamicPhaseMap.get(type)?.isEmpty() === false;
  }

  public exists<T extends PhaseString>(type: T, condition?: PhaseConditionFunc<T>): boolean {
    return !!this.dynamicPhaseMap.get(type)?.hasPhaseWithCondition(condition);
  }

  public removePhase<T extends PhaseString>(type: T, condition: PhaseConditionFunc<T>) {
    return this.dynamicPhaseMap.get(type)?.remove(condition);
  }

  public setMoveTimingModifier(condition: PhaseConditionFunc<"MovePhase">, modifier: MovePhaseTimingModifier) {
    this.getMovePhaseQueue().setTimingModifier(condition, modifier);
  }

  public setMoveForPhase(condition: PhaseConditionFunc<"MovePhase">, move: PokemonMove) {
    this.getMovePhaseQueue().setMoveForPhase(condition, move);
  }

  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon) {
    this.getMovePhaseQueue().redirectMoves(removedPokemon, allyPokemon);
  }

  public getMovePhase(condition: PhaseConditionFunc<"MovePhase">): MovePhase | undefined {
    return this.getMovePhaseQueue().findPhase(condition);
  }

  public cancelMovePhase(condition: PhaseConditionFunc<"MovePhase">): void {
    this.getMovePhaseQueue().cancelMove(condition);
  }

  public setMoveOrder(order: BattlerIndex[]): void {
    this.getMovePhaseQueue().setMoveOrder(order);
  }

  public getLastTurnOrder(): Pokemon[] {
    return this.getMovePhaseQueue().getTurnOrder();
  }

  public clearLastTurnOrder(): void {
    this.getMovePhaseQueue().clearTurnOrder();
  }

  private getMovePhaseQueue(): MovePhasePriorityQueue {
    return this.dynamicPhaseMap.get("MovePhase") as MovePhasePriorityQueue;
  }

  private isDynamicPhase(phase: Phase): phase is DynamicPhase {
    return typeof (phase as any).getPokemon === "function" && !nonDynamicPokemonPhases.includes(phase.phaseName);
  }
}
