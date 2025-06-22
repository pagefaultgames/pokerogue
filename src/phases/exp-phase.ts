import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { NumberHolder } from "#app/utils/common";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { TRAINER_ITEM_EFFECT } from "#app/items/trainer-item";

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
  public readonly phaseName = "ExpPhase";
  private expValue: number;

  constructor(partyMemberIndex: number, expValue: number) {
    super(partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new NumberHolder(this.expValue);
    globalScene.applyPlayerItems(TRAINER_ITEM_EFFECT.EXP_BOOSTER, { numberHolder: exp });
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
          globalScene.phaseManager.unshiftNew("LevelUpPhase", this.partyMemberIndex, lastLevel, newLevel);
        }
        pokemon.updateInfo().then(() => this.end());
      },
      null,
      true,
    );
  }
}
