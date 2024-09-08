import BattleScene from "#app/battle-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { ExpBoosterModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { LevelUpPhase } from "./level-up-phase";
import * as LoggerTools from "../logger";

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
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
    this.scene.ui.showText(i18next.t("battle:expGain", { pokemonName: getPokemonNameWithAffix(pokemon), exp: exp.value }), null, () => {
      const lastLevel = pokemon.level;
      pokemon.addExp(exp.value);
      const newLevel = pokemon.level;
      if (newLevel > lastLevel) {
        this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
      }
      pokemon.updateInfo().then(() => this.end());
    }, null, true);
  }
}
