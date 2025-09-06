import type { BattlerIndex } from "#enums/battler-index";
import { applyMoveAttrs } from "#moves/apply-attrs";
import type { PokemonMove } from "#moves/pokemon-move";
import { PokemonPhase } from "#phases/pokemon-phase";

export class MoveHeaderPhase extends PokemonPhase {
  public readonly phaseName = "MoveHeaderPhase";
  public move: PokemonMove;

  constructor(battlerIndex: BattlerIndex, move: PokemonMove) {
    super(battlerIndex);

    this.move = move;
  }

  canMove(): boolean {
    return this.getPokemon().isActive(true) && this.move.isUsable(this.getPokemon());
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs("MoveHeaderAttr", this.getPokemon(), null, this.move.getMove());
    }
    this.end();
  }
}
