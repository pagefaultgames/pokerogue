import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#enums/battler-index";
import { PokemonPhase } from "#phases/pokemon-phase";

export class ShinySparklePhase extends PokemonPhase {
  public readonly phaseName = "ShinySparklePhase";
  // biome-ignore lint/complexity/noUselessConstructor: This makes `battlerIndex` required
  constructor(battlerIndex: BattlerIndex) {
    super(battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    globalScene.time.delayedCall(1000, () => this.end());
  }
}
