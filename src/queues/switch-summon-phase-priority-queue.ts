import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";

export class SwitchSummonPhasePriorityQueue extends PokemonPhasePriorityQueue<SwitchSummonPhase> {
  public override push(phase: SwitchSummonPhase): void {
    // The same pokemon or slot cannot be switched into at the same time
    this.queue.filter(
      old =>
        old.getPokemon() !== phase.getPokemon() &&
        !(old.isPlayer() === phase.isPlayer() && old.getFieldIndex() === phase.getFieldIndex()),
    );
    super.push(phase);
  }
}
