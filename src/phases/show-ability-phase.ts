import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
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

      if (!pokemon.isPlayer()) {
        /** If its an enemy pokemon, list it as last enemy to use ability or move */
        globalScene.currentBattle.lastEnemyInvolved = pokemon.getBattlerIndex() % 2;
      } else {
        globalScene.currentBattle.lastPlayerInvolved = pokemon.getBattlerIndex() % 2;
      }

      globalScene.abilityBar.showAbility(pokemon, this.passive);

      if (pokemon?.battleData) {
        pokemon.battleData.abilityRevealed = true;
      }
    }

    this.end();
  }
}
