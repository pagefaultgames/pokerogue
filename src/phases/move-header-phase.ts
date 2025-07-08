import { applyMoveAttrs } from "#app/data/moves/apply-attrs";
import type { PokemonMove } from "#app/data/moves/pokemon-move";
import type Pokemon from "#app/field/pokemon";
import { BattlePhase } from "./battle-phase";

export class MoveHeaderPhase extends BattlePhase {
  public readonly phaseName = "MoveHeaderPhase";
  public pokemon: Pokemon;
  public move: PokemonMove;

  constructor(pokemon: Pokemon, move: PokemonMove) {
    super();

    this.pokemon = pokemon;
    this.move = move;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon);
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs("MoveHeaderAttr", this.pokemon, null, this.move.getMove());
    }
    this.end();
  }
}
