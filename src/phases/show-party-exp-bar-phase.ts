import BattleScene from "#app/battle-scene.js";
import { ExpNotification } from "#app/enums/exp-notification.js";
import { ExpBoosterModifier } from "#app/modifier/modifier.js";
import * as Utils from "#app/utils.js";
import { HidePartyExpBarPhase } from "./hide-party-exp-bar-phase";
import { LevelUpPhase } from "./level-up-phase";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
    }
    this.scene.unshiftPhase(new HidePartyExpBarPhase(this.scene));
    pokemon.updateInfo();

    if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else if (this.scene.expParty === ExpNotification.ONLY_LEVEL_UP) {
      if (newLevel > lastLevel) { // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, this.scene.expParty === ExpNotification.ONLY_LEVEL_UP, newLevel).then(() => {
          setTimeout(() => this.end(), 800 / Math.pow(2, this.scene.expGainsSpeed));
        });
      } else {
        this.end();
      }
    } else if (this.scene.expGainsSpeed < 3) {
      this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
        setTimeout(() => this.end(), 500 / Math.pow(2, this.scene.expGainsSpeed));
      });
    } else {
      this.end();
    }

  }
}
