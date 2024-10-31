import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { SummonPhase } from "./summon-phase";
import { gScene } from "#app/battle-scene";

export class SummonMissingPhase extends SummonPhase {
  constructor(fieldIndex: integer) {
    super(fieldIndex);
  }

  preSummon(): void {
    gScene.ui.showText(i18next.t("battle:sendOutPokemon", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
    gScene.time.delayedCall(250, () => this.summon());
  }
}
