import type { DynamicPhase } from "#app/@types/phase-types";
import { PriorityQueue } from "#app/queues/priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";

/** A generic speed-based priority queue of {@linkcode DynamicPhase}s */
export class PokemonPhasePriorityQueue<T extends DynamicPhase> extends PriorityQueue<T> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
