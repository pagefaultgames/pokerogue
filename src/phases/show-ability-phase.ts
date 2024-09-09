import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";
import * as LoggerTools from "../logger";

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, passive: boolean = false) {
    super(scene, battlerIndex);

    this.passive = passive;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon) {
      this.scene.abilityBar.showAbility(pokemon, this.passive);

      if (pokemon?.battleData) {
        pokemon.battleData.abilityRevealed = true;
      }
    }

    this.end();
  }
}
