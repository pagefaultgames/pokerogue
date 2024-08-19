import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { PokemonPhase } from "./pokemon-phase";

export class ShinySparklePhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    this.scene.time.delayedCall(1000, () => this.end());
  }
}
