import type { Pokemon } from "#app/field/pokemon";
import { PriorityQueue } from "#app/queues/phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";

/** A priority queue of {@linkcode Pokemon}s */
export class PokemonPriorityQueue extends PriorityQueue<Pokemon> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
