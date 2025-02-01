import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlePhase } from "./battle-phase";
import i18next from "i18next";
import { globalScene } from "#app/global-scene";
import { Type } from "#app/enums/type";
import { achvs } from "#app/system/achv";
import { SpeciesFormChangeTeraTrigger } from "#app/data/pokemon-forms";
import { CommonAnim } from "#app/data/battle-anims";
import { CommonAnimPhase } from "./common-anim-phase";

export class TeraPhase extends BattlePhase {
  public pokemon: Pokemon;

  constructor(pokemon: Pokemon) {
    super();

    this.pokemon = pokemon;
  }

  start() {
    super.start();

    console.log(this.pokemon.name, "terastallized to", Type[this.pokemon.teraType].toString()); // TODO: Improve log

    // const parent = this.pokemon.parentContainer;
    // // const texture = this.pokemon.getSprite().texture;
    // // const [ width, height ] = [ texture.source[0].width, texture.source[0].height ];
    // // const [ xOffset, yOffset ] = [ -this.pokemon.getSprite().originX * width, -s.originY * s.height ];
    // const teraburst = globalScene.addFieldSprite(((this.pokemon?.x || 0)), ((this.pokemon?.y || 0)), "terastallize");
    // teraburst.setName("sprite-terastallize");
    // teraburst.play("terastallize");
    // parent.add(teraburst);
    // this.pokemon.scene.time.delayedCall(Utils.fixedInt(Math.floor((1000 / 12) * 13)), () => teraburst.destroy());

    globalScene.queueMessage(getPokemonNameWithAffix(this.pokemon) + " terrastallized into a " + i18next.t(`pokemonInfo:Type.${Type[this.pokemon.teraType]}`) + " type!"); // TODO: Localize this
    globalScene.unshiftPhase(new CommonAnimPhase(this.pokemon.getBattlerIndex(), this.pokemon.getBattlerIndex(), CommonAnim.TERASTALLIZE, false));

    this.end();
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
