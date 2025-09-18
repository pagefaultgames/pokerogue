import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { MovePhase } from "#app/phases/move-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import type { BattlerIndex } from "#enums/battler-index";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { PhaseConditionFunc } from "#types/phase-types";

/** A priority queue responsible for the ordering of {@linkcode MovePhase}s */
export class MovePhasePriorityQueue extends PokemonPhasePriorityQueue<MovePhase> {
  private lastTurnOrder: Pokemon[] = [];

  protected override reorder(): void {
    super.reorder();
    this.sortPostSpeed();
  }

  public cancelMove(condition: PhaseConditionFunc<"MovePhase">): void {
    this.queue.find(p => condition(p))?.cancel();
  }

  public setTimingModifier(condition: PhaseConditionFunc<"MovePhase">, modifier: MovePhaseTimingModifier): void {
    const phase = this.queue.find(p => condition(p));
    if (phase != null) {
      phase.timingModifier = modifier;
    }
  }

  public setMoveForPhase(condition: PhaseConditionFunc<"MovePhase">, move: PokemonMove) {
    const phase = this.queue.find(p => condition(p));
    if (phase != null) {
      phase.move = move;
    }
  }

  public redirectMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    // failsafe: if not a double battle just return
    if (!globalScene.currentBattle.double) {
      return;
    }

    // TODO: simplify later
    if (allyPokemon?.isActive(true)) {
      this.queue
        .filter(
          mp =>
            mp.targets.length === 1
            && mp.targets[0] === removedPokemon.getBattlerIndex()
            && mp.pokemon.isPlayer() !== allyPokemon.isPlayer(),
        )
        .forEach(targetingMovePhase => {
          if (targetingMovePhase && targetingMovePhase.targets[0] !== allyPokemon.getBattlerIndex()) {
            targetingMovePhase.targets[0] = allyPokemon.getBattlerIndex();
          }
        });
    }
  }

  public setMoveOrder(order: BattlerIndex[]) {
    this.setOrder = order;
  }

  public override pop(): MovePhase | undefined {
    this.reorder();
    const phase = this.queue.shift();
    if (phase) {
      this.lastTurnOrder.push(phase.pokemon);
    }
    return phase;
  }

  public getTurnOrder(): Pokemon[] {
    return this.lastTurnOrder;
  }

  public clearTurnOrder(): void {
    this.lastTurnOrder = [];
  }

  public override clear(): void {
    this.setOrder = undefined;
    this.lastTurnOrder = [];
    super.clear();
  }

  private sortPostSpeed(): void {
    this.queue.sort((a: MovePhase, b: MovePhase) => {
      const priority = [a, b].map(movePhase => {
        const move = movePhase.move.getMove();
        return move.getPriority(movePhase.pokemon, true);
      });

      const timingModifiers = [a, b].map(movePhase => movePhase.timingModifier);

      if (timingModifiers[0] !== timingModifiers[1]) {
        return timingModifiers[1] - timingModifiers[0];
      }

      return priority[1] - priority[0];
    });
  }
}
