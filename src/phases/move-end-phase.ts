import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { PokemonPhase } from "./pokemon-phase";
import * as LoggerTools from "../logger";

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
