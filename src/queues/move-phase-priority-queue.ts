import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { MovePhase } from "#app/phases/move-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
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
    this.queue.find(condition)?.cancel();
  }

  public setTimingModifier(condition: PhaseConditionFunc<"MovePhase">, modifier: MovePhaseTimingModifier): void {
    const phase = this.queue.find(condition);
    if (phase != null) {
      phase.timingModifier = modifier;
    }
  }

  public setMoveForPhase(condition: PhaseConditionFunc<"MovePhase">, move: PokemonMove) {
    const phase = this.queue.find(condition);
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
            && mp.pokemon.isOpponent(allyPokemon),
        )
        .forEach(targetingMovePhase => {
          if (targetingMovePhase && targetingMovePhase.targets[0] !== allyPokemon.getBattlerIndex()) {
            targetingMovePhase.targets[0] = allyPokemon.getBattlerIndex();
          }
        });
    }
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
    this.lastTurnOrder = [];
    super.clear();
  }

  private sortPostSpeed(): void {
    this.queue.sort(
      (a: MovePhase, b: MovePhase) =>
        // formatting
        b.timingModifier - a.timingModifier || getPriorityForMP(b) - getPriorityForMP(a),
    );
  }
}

function getPriorityForMP(mp: MovePhase): number {
  const move = mp.move.getMove();
  return move.getPriority(mp.pokemon, true);
}
