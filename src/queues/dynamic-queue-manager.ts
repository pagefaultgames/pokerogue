import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { DynamicPhaseString, PhaseString } from "#app/@types/phase-types";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type Pokemon from "#app/field/pokemon";
import type { Phase } from "#app/phase";
import { MovePhasePriorityQueue } from "#app/queues/move-phase-priority-queue";
import type { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { PostSummonPhasePriorityQueue } from "#app/queues/post-summon-phase-priority-queue";
import { SwitchSummonPhasePriorityQueue } from "#app/queues/switch-summon-phase-priority-queue";
import type { BattlerIndex } from "#enums/battler-index";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";

export class DynamicQueueManager {
  private dynamicPhaseMap: Map<PhaseString, PhasePriorityQueue<Phase>>;

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

  public queueDynamicPhase(phase: Phase): void {
    this.dynamicPhaseMap.get(phase.phaseName)?.push(phase);
  }

  public popNextPhase(type?: DynamicPhaseString): Phase | undefined {
    const queue = type
      ? this.dynamicPhaseMap.get(type)
      : [...this.dynamicPhaseMap.values()].find(queue => !queue.isEmpty());
    return queue?.pop();
  }

  public isDynamicPhase(type: PhaseString): boolean {
    return this.dynamicPhaseMap.has(type);
  }

  public findPhaseOfType(type: PhaseString, condition?: PhaseConditionFunc): Phase | undefined {
    return this.dynamicPhaseMap.get(type)?.findPhase(condition);
  }

  public exists(type: PhaseString, condition?: PhaseConditionFunc): boolean {
    return !!this.dynamicPhaseMap.get(type)?.hasPhaseWithCondition(condition);
  }

  public removePhase(condition: PhaseConditionFunc) {
    for (const queue of this.dynamicPhaseMap.values()) {
      if (queue.remove(condition)) {
        return true;
      }
    }
    return false;
  }

  public setMoveTimingModifier(condition: PhaseConditionFunc, modifier: MovePhaseTimingModifier) {
    this.getMovePhaseQueue().setTimingModifier(condition, modifier);
  }

  public setMoveForPhase(condition: PhaseConditionFunc, move: PokemonMove) {
    this.getMovePhaseQueue().setMoveForPhase(condition, move);
  }

  public setMoveOrder(order: BattlerIndex[]) {
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
}
