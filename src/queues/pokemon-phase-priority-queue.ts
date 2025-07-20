import type { DynamicPhase } from "#app/@types/phase-types";
import { PriorityQueue } from "#app/queues/phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";
import type { BattlerIndex } from "#enums/battler-index";

export class PokemonPhasePriorityQueue<T extends DynamicPhase> extends PriorityQueue<T> {
  protected setOrder: BattlerIndex[] | undefined;
  protected override reorder(): void {
    if (this.setOrder) {
      this.queue.sort(
        (a, b) =>
          this.setOrder!.indexOf(a.getPokemon().getBattlerIndex()) -
          this.setOrder!.indexOf(b.getPokemon().getBattlerIndex()),
      );
    } else {
      this.queue = sortInSpeedOrder(this.queue);
    }
  }
}
