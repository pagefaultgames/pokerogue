import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type { MovePhase } from "#app/phases/move-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import { isNullOrUndefined } from "#app/utils/common";
import type { BattlerIndex } from "#enums/battler-index";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";

export class MovePhasePriorityQueue extends PokemonPhasePriorityQueue<MovePhase> {
  public override reorder(): void {
    super.reorder();
    this.sortPostSpeed();
  }

  public setTimingModifier(condition: PhaseConditionFunc, modifier: MovePhaseTimingModifier): void {
    const phase = this.queue.find(phase => condition(phase));
    if (!isNullOrUndefined(phase)) {
      phase.timingModifier = modifier;
    }
  }

  public setMoveForPhase(condition: PhaseConditionFunc, move: PokemonMove) {
    const phase = this.queue.find(phase => condition(phase));
    if (!isNullOrUndefined(phase)) {
      phase.move = move;
    }
  }

  public setMoveOrder(order: BattlerIndex[]) {
    this.setOrder = order;
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

      const timingModifiers = [a, b].map(movePhase => movePhase.timingModifier);

      if (timingModifiers[0] !== timingModifiers[1]) {
        return timingModifiers[1] - timingModifiers[0];
      }

      if (priority[0] === priority[1] && priorityModifiers[0] !== priorityModifiers[1]) {
        return priorityModifiers[1] - priorityModifiers[0];
      }

      return priority[1] - priority[0];
    });
  }
}
