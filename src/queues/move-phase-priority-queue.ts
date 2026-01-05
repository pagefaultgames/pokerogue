import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { MovePhase } from "#app/phases/move-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import type { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { MovePriorityInBracket } from "#enums/move-priority-in-bracket";
import type { PhaseConditionFunc } from "#types/phase-types";

/** A priority queue responsible for the ordering of {@linkcode MovePhase}s */
export class MovePhasePriorityQueue extends PokemonPhasePriorityQueue<MovePhase> {
  private lastTurnOrder: Pokemon[] = [];

  protected override reorder(): void {
    super.reorder();
    this.sortPostSpeed();
  }

  /**
   * Sort queued {@linkcode MovePhase}s after speed order has been applied. \
   * Checks for timing modifiers (Quash/etc), innate move priority and
   * priority modifiers (Quick Claw/etc) in that order.
   */
  private sortPostSpeed(): void {
    this.queue.sort((a, b) => {
      if (b.timingModifier !== a.timingModifier) {
        return b.timingModifier - a.timingModifier;
      }

      const aPriority = getPriorityForMP(a);
      const bPriority = getPriorityForMP(b);
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return getPriorityModifiersForMP(b) - getPriorityModifiersForMP(a);
    });
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
          // TODO: this shouldn't ever be falsy
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
}

/**
 * Helper function to retrieve the priority modifier for a given move phase.
 * @param mp - The `MovePhase` to check
 * @returns The phase's priority modifier
 */
function getPriorityModifiersForMP(mp: MovePhase): MovePriorityInBracket {
  const move = mp.move.getMove();
  return move.getPriorityModifier(mp.pokemon, true);
}

/**
 * Helper function to retrieve the priority for a given move phase.
 * @param mp - The `MovePhase` to check
 * @returns The phase's priority
 */
function getPriorityForMP(mp: MovePhase): number {
  const move = mp.move.getMove();
  return move.getPriority(mp.pokemon, true);
}
