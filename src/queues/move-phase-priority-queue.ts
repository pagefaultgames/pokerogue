import type { MovePhase } from "#app/phases/move-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";

export class MovePhasePriorityQueue extends PokemonPhasePriorityQueue<MovePhase> {
  public override reorder(): void {
    super.reorder();
    this.sortPostSpeed();
  }

  private sortPostSpeed(): void {
    this.queue.sort((a: MovePhase, b: MovePhase) => {
      const priority = [a, b].map(movePhase => {
        const move = movePhase.move.getMove();
        return move.getPriority(movePhase.pokemon, true);
      });

      const priorityModifiers = [a, b].map(movePhase =>
        movePhase.move.getMove().getPriorityModifier(movePhase.pokemon),
      );

      if (priority[0] === priority[1] && priorityModifiers[0] !== priorityModifiers[1]) {
        return priorityModifiers[0] - priorityModifiers[1];
      }

      return priority[0] - priority[1];
    });
  }
}
