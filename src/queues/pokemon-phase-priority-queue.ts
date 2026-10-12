import { PriorityQueue } from "#queues/priority-queue";
import type { DynamicPhase } from "#types/phase-types";
import { sortInSpeedOrder } from "#utils/speed-order";

/** A generic speed-based priority queue of {@linkcode DynamicPhase}s. */
export class DynamicPhasePriorityQueue<T extends DynamicPhase> extends PriorityQueue<T> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
