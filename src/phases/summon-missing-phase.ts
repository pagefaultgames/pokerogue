import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { SummonPhase } from "./summon-phase";
import { globalScene } from "#app/global-scene";

export class SummonMissingPhase extends SummonPhase {
  constructor(fieldIndex: integer) {
    super(fieldIndex);
  }

  preSummon(): void {
    globalScene.ui.showText(i18next.t("battle:sendOutPokemon", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
    globalScene.time.delayedCall(250, () => this.summon());
  }
}
