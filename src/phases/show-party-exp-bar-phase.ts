import { gScene } from "#app/battle-scene";
import { ExpGainsSpeed } from "#app/enums/exp-gains-speed";
import { ExpNotification } from "#app/enums/exp-notification";
import { ExpBoosterModifier } from "#app/modifier/modifier";
import * as Utils from "#app/utils";
import { HidePartyExpBarPhase } from "./hide-party-exp-bar-phase";
import { LevelUpPhase } from "./level-up-phase";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(partyMemberIndex: integer, expValue: number) {
    super(partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    gScene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      gScene.unshiftPhase(new LevelUpPhase(this.partyMemberIndex, lastLevel, newLevel));
    }
    gScene.unshiftPhase(new HidePartyExpBarPhase());
    pokemon.updateInfo();

    if (gScene.expParty === ExpNotification.SKIP) {
      this.end();
    } else if (gScene.expParty === ExpNotification.ONLY_LEVEL_UP) {
      if (newLevel > lastLevel) { // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        gScene.partyExpBar.showPokemonExp(pokemon, exp.value, gScene.expParty === ExpNotification.ONLY_LEVEL_UP, newLevel).then(() => {
          setTimeout(() => this.end(), 800 / Math.pow(2, gScene.expGainsSpeed));
        });
      } else {
        this.end();
      }
    } else if (gScene.expGainsSpeed < ExpGainsSpeed.SKIP) {
      gScene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
        setTimeout(() => this.end(), 500 / Math.pow(2, gScene.expGainsSpeed));
      });
    } else {
      this.end();
    }

  }
}
