import type { DynamicPhase } from "#app/@types/phase-types";
import { PriorityQueue } from "#app/queues/priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";
import type { BattlerIndex } from "#enums/battler-index";

/** A generic speed-based priority queue of {@linkcode DynamicPhase}s */
export class PokemonPhasePriorityQueue<T extends DynamicPhase> extends PriorityQueue<T> {
  protected setOrder: BattlerIndex[] | undefined;
  protected override reorder(): void {
    const setOrder = this.setOrder;
    if (setOrder) {
      this.queue.sort(
        (a, b) =>
          setOrder.indexOf(a.getPokemon().getBattlerIndex()) - setOrder.indexOf(b.getPokemon().getBattlerIndex()),
      );
    } else {
      this.queue = sortInSpeedOrder(this.queue);
    }
  }
}
