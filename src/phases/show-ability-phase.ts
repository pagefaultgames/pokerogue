import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { PokemonPhase } from "./pokemon-phase";
import { getPokemonNameWithAffix } from "#app/messages";
import { HideAbilityPhase } from "#app/phases/hide-ability-phase";

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;
  private pokemonName: string;
  private abilityName: string;
  private pokemonOnField: boolean;

  constructor(battlerIndex: BattlerIndex, passive = false) {
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

    if (!this.pokemonOnField || !this.getPokemon()) {
      return this.end();
    }

    // If the bar is already out, hide it before showing the new one
    if (globalScene.abilityBar.isVisible()) {
      globalScene.unshiftPhase(new HideAbilityPhase());
      globalScene.unshiftPhase(new ShowAbilityPhase(this.battlerIndex, this.passive));
      return this.end();
    }

    const pokemon = this.getPokemon();

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
  }
}
