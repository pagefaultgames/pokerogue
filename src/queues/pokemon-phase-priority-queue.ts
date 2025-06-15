import type { PartyMemberPokemonPhase } from "#app/phases/party-member-pokemon-phase";
import type { PokemonPhase } from "#app/phases/pokemon-phase";
import { PhasePriorityQueue } from "#app/queues/phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";

export class PokemonPhasePriorityQueue<T extends PokemonPhase | PartyMemberPokemonPhase> extends PhasePriorityQueue<T> {
  public override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
  }
}
