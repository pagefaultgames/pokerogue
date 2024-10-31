import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";

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

        if (!pokemon.isPlayer()) {
          /** If its an enemy pokemon, list it as last enemy to use ability or move */
          this.scene.currentBattle.lastEnemyInvolved = this.fieldIndex;
        } else {
          this.scene.currentBattle.lastPlayerInvolved = this.fieldIndex;
        }

        pokemon.battleData.abilityRevealed = true;
      }
    }

    this.end();
  }
}
