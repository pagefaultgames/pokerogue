import BattleScene from "#app/battle-scene.js";
import { applyMoveAttrs, MoveHeaderAttr } from "#app/data/move.js";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";
import { BattlePhase } from "./battle-phase";

export class MoveHeaderPhase extends BattlePhase {
  public pokemon: Pokemon;
  public move: PokemonMove;

  constructor(scene: BattleScene, pokemon: Pokemon, move: PokemonMove) {
    super(scene);

    this.pokemon = pokemon;
    this.move = move;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon);
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs(MoveHeaderAttr, this.pokemon, null, this.move.getMove()).then(() => this.end());
    } else {
      this.end();
    }
  }
}
