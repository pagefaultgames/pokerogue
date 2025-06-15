import type { PhaseString } from "#app/@types/phase-types";
import type { Phase } from "#app/phase";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { MovePhasePriorityQueue } from "#app/queues/move-phase-priority-queue";
import type { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import { PostSummonPhasePriorityQueue } from "#app/queues/post-summon-phase-priority-queue";
export class DynamicQueueManager {
  private dynamicPhaseMap: Map<PhaseString, PhasePriorityQueue<Phase>>;

  constructor() {
    this.dynamicPhaseMap = new Map();
    this.dynamicPhaseMap.set("SwitchSummonPhase", new PokemonPhasePriorityQueue<SwitchSummonPhase>());
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

  public popNextPhaseOfType(type: PhaseString): Phase | undefined {
    return this.dynamicPhaseMap.get(type)?.pop();
  }

  public isDynamicPhase(type: PhaseString): boolean {
    return this.dynamicPhaseMap.has(type);
  }
}
