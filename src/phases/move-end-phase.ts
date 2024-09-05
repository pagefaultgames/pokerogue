import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { BattlerTagLapseType } from "#app/data/battler-tags.js";
import { PokemonPhase } from "./pokemon-phase";

export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (pokemon.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    this.scene.arena.setIgnoreAbilities(false);

    this.end();
  }
}
