import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SummonPhase } from "#phases/summon-phase";
import i18next from "i18next";

export class SummonMissingPhase extends SummonPhase {
  public readonly phaseName = "SummonMissingPhase";
  preSummon(): void {
    globalScene.ui.showText(
      i18next.t("battle:sendOutPokemon", {
        pokemonName: getPokemonNameWithAffix(this.getPokemon()),
      }),
    );
    globalScene.time.delayedCall(250, () => this.summon());
  }
}
