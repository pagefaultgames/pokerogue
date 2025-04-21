import { globalScene } from "#app/global-scene";
import { ExpGainsSpeed } from "#app/enums/exp-gains-speed";
import { ExpNotification } from "#app/enums/exp-notification";
import { ExpBoosterModifier } from "#app/modifier/modifier";
import { NumberHolder } from "#app/utils/common";
import { HidePartyExpBarPhase } from "./hide-party-exp-bar-phase";
import { LevelUpPhase } from "./level-up-phase";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(partyMemberIndex: number, expValue: number) {
    super(partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new NumberHolder(this.expValue);
    globalScene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      globalScene.unshiftPhase(new LevelUpPhase(this.partyMemberIndex, lastLevel, newLevel));
    }
    globalScene.unshiftPhase(new HidePartyExpBarPhase());
    pokemon.updateInfo();

    if (globalScene.expParty === ExpNotification.SKIP) {
      this.end();
    } else if (globalScene.expParty === ExpNotification.ONLY_LEVEL_UP) {
      if (newLevel > lastLevel) {
        // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        globalScene.partyExpBar
          .showPokemonExp(pokemon, exp.value, globalScene.expParty === ExpNotification.ONLY_LEVEL_UP, newLevel)
          .then(() => {
            setTimeout(() => this.end(), 800 / Math.pow(2, globalScene.expGainsSpeed));
          });
      } else {
        this.end();
      }
    } else if (globalScene.expGainsSpeed < ExpGainsSpeed.SKIP) {
      globalScene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
        setTimeout(() => this.end(), 500 / Math.pow(2, globalScene.expGainsSpeed));
      });
    } else {
      this.end();
    }
  }
}
