import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonBattleAnim } from "#data/battle-anims";
import { SpeciesFormChangeTeraTrigger } from "#data/form-change-triggers";
import { CommonAnim } from "#enums/move-anims-common";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import { achvs } from "#system/achv";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export class TeraPhase extends BattlePhase {
  public readonly phaseName = "TeraPhase";
  public pokemon: Pokemon;

  constructor(pokemon: Pokemon) {
    super();

    this.pokemon = pokemon;
  }

  start() {
    super.start();

    globalScene.phaseManager.queueMessage(
      i18next.t("battle:pokemonTerastallized", {
        pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
        type: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.pokemon.getTeraType()])}`),
      }),
    );
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
      if (this.pokemon.getTeraType() === PokemonType.STELLAR) {
        globalScene.validateAchv(achvs.STELLAR_TERASTALLIZE);
      }
    }

    super.end();
  }
}
