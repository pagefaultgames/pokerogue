import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";
import { getPokemonNameWithAffix } from "#app/messages";

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;
  private pokemonName: string;
  private abilityName: string;

  constructor(battlerIndex: BattlerIndex, passive: boolean = false) {
    super(battlerIndex);

    this.passive = passive;
    // Set these now as the pokemon object may change before the queued phase is run
    this.pokemonName = getPokemonNameWithAffix(this.getPokemon());
    this.abilityName = passive ? this.getPokemon().getPassiveAbility().name : this.getPokemon().getAbility().name;
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

      globalScene.abilityBar.showAbility(this.pokemonName, this.abilityName, this.passive).then(() => {
        if (pokemon?.battleData) {
          pokemon.battleData.abilityRevealed = true;
        }

        this.end();
      });
    } else {
      this.end();
    }
  }
}
