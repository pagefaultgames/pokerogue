import type { PartyMemberPokemonPhase } from "#app/phases/party-member-pokemon-phase";
import type { PokemonPhase } from "#app/phases/pokemon-phase";
import { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";
import type { BattlerIndex } from "#enums/battler-index";

export class PokemonPhasePriorityQueue<T extends PokemonPhase | PartyMemberPokemonPhase> extends PhasePriorityQueue<T> {
  protected setOrder: BattlerIndex[] | undefined;
  public override reorder(): void {
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
