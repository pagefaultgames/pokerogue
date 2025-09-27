import type { Pokemon } from "#field/pokemon";
import { applyMoveAttrs } from "#moves/apply-attrs";
import type { PokemonMove } from "#moves/pokemon-move";
import { BattlePhase } from "#phases/battle-phase";

export class MoveHeaderPhase extends BattlePhase {
  public readonly phaseName = "MoveHeaderPhase";
  public move: PokemonMove;
  public pokemon: Pokemon;

  constructor(pokemon: Pokemon, move: PokemonMove) {
    super();

    this.pokemon = pokemon;
    this.move = move;
  }

  public getPokemon(): Pokemon {
    return this.pokemon;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon)[0];
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs("MoveHeaderAttr", this.pokemon, null, this.move.getMove());
    }
    this.end();
  }
}
