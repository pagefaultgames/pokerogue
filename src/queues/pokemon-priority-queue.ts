import type { Pokemon } from "#app/field/pokemon";
import { PriorityQueue } from "#app/queues/priority-queue";
import { sortInSpeedOrder } from "#utils/speed-order-utils";

/** A priority queue of {@linkcode Pokemon}s */
export class PokemonPriorityQueue extends PriorityQueue<Pokemon> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
