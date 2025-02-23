import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlePhase } from "./battle-phase";
import i18next from "i18next";
import { globalScene } from "#app/global-scene";
import { Type } from "#app/enums/type";
import { achvs } from "#app/system/achv";
import { SpeciesFormChangeTeraTrigger } from "#app/data/pokemon-forms";
import { CommonAnim, CommonBattleAnim } from "#app/data/battle-anims";

export class TeraPhase extends BattlePhase {
  public pokemon: Pokemon;

  constructor(pokemon: Pokemon) {
    super();

    this.pokemon = pokemon;
  }

  start() {
    super.start();

    console.log(this.pokemon.name, "terastallized to", Type[this.pokemon.teraType].toString());

    globalScene.queueMessage(i18next.t("battle:pokemonTerastallized", { pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon), type: i18next.t(`pokemonInfo:Type.${Type[this.pokemon.teraType]}`) }));
    new CommonBattleAnim(CommonAnim.TERASTALLIZE, this.pokemon).play(false, () => {
      this.end();
    });
  }


  end() {
    this.pokemon.isTerastallized = true;
    this.pokemon.updateSpritePipelineData();

    if (this.pokemon.isPlayer()) {
      globalScene.arena.playerTerasUsed += 1;
    }

    globalScene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangeTeraTrigger);

    if (this.pokemon.isPlayer()) {
      globalScene.validateAchv(achvs.TERASTALLIZE);
      if (this.pokemon.teraType === Type.STELLAR) {
        globalScene.validateAchv(achvs.STELLAR_TERASTALLIZE);
      }
    }

    super.end();
  }
}
