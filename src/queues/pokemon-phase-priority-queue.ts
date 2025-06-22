import type { DynamicPhase } from "#app/@types/phase-types";
import { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";
import type { BattlerIndex } from "#enums/battler-index";

export class PokemonPhasePriorityQueue<T extends DynamicPhase> extends PhasePriorityQueue<T> {
  protected setOrder: BattlerIndex[] | undefined;
  public override reorder(): void {
    this.queue = this.queue.filter(phase => phase.getPokemon()?.isActive(true));
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
