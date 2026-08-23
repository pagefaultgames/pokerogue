import type { Pokemon } from "#field/pokemon";
import { PriorityQueue } from "#queues/priority-queue";
import { sortInSpeedOrder } from "#utils/speed-order";

/** A priority queue of {@linkcode Pokemon}s */
export class PokemonPriorityQueue extends PriorityQueue<Pokemon> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
