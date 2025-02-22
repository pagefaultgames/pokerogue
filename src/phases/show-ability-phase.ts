import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";
import { getPokemonNameWithAffix } from "#app/messages";

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;
  private pokemonName: string;
  private abilityName: string;
  private pokemonOnField: boolean;

  constructor(battlerIndex: BattlerIndex, passive: boolean = false) {
    super(battlerIndex);

    this.passive = passive;

    const pokemon = this.getPokemon();
    if (pokemon) {
      // Set these now as the pokemon object may change before the queued phase is run
      this.pokemonName = getPokemonNameWithAffix(pokemon);
      this.abilityName = (passive ? this.getPokemon().getPassiveAbility() : this.getPokemon().getAbility()).name;
      this.pokemonOnField = true;
    } else {
      this.pokemonOnField = false;
    }
  }

  start() {
    super.start();

    if (!this.pokemonOnField) {
      return this.end();
    }
    const pokemon = this.getPokemon();

    if (pokemon) {
      if (!pokemon.isPlayer()) {
        /** If its an enemy pokemon, list it as last enemy to use ability or move */
        globalScene.currentBattle.lastEnemyInvolved = pokemon.getBattlerIndex() % 2;
      } else {
        globalScene.currentBattle.lastPlayerInvolved = pokemon.getBattlerIndex() % 2;
      }

      globalScene.abilityBar.showAbility(this.pokemonName, this.abilityName, this.passive, this.player).then(() => {
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
