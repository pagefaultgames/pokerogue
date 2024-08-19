import BattleScene from "#app/battle-scene.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import i18next from "i18next";
import { SummonPhase } from "./summon-phase";

export class SummonMissingPhase extends SummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  preSummon(): void {
    this.scene.ui.showText(i18next.t("battle:sendOutPokemon", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
    this.scene.time.delayedCall(250, () => this.summon());
  }
}
