import { gScene } from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;

  constructor(battlerIndex: BattlerIndex, passive: boolean = false) {
    super(battlerIndex);

    this.passive = passive;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon) {
      gScene.abilityBar.showAbility(pokemon, this.passive);

      if (pokemon?.battleData) {
        pokemon.battleData.abilityRevealed = true;
      }
    }

    this.end();
  }
}
