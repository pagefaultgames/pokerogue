import { applyMoveAttrs } from "#app/data/moves/apply-attrs";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import type { BattlerIndex } from "#enums/battler-index";

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
