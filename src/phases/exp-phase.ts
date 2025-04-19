import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { ExpBoosterModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { NumberHolder } from "#app/utils/common";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { LevelUpPhase } from "./level-up-phase";

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
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
    globalScene.ui.showText(
      i18next.t("battle:expGain", {
        pokemonName: getPokemonNameWithAffix(pokemon),
        exp: exp.value,
      }),
      null,
      () => {
        const lastLevel = pokemon.level;
        pokemon.addExp(exp.value);
        const newLevel = pokemon.level;
        if (newLevel > lastLevel) {
          globalScene.unshiftPhase(new LevelUpPhase(this.partyMemberIndex, lastLevel, newLevel));
        }
        pokemon.updateInfo().then(() => this.end());
      },
      null,
      true,
    );
  }
}
