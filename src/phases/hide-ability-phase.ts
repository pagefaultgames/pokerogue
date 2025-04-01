import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";

export class HideAbilityPhase extends PokemonPhase {
  private passive: boolean;

  constructor(battlerIndex: BattlerIndex, passive = false) {
    super(battlerIndex);

    this.passive = passive;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon) {
      globalScene.abilityBar.hide().then(() => {
        this.end();
      });
    } else {
      this.end();
    }
  }
}
