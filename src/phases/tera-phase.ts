import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlePhase } from "./battle-phase";
import i18next from "i18next";
import { globalScene } from "#app/global-scene";
import { Type } from "#app/enums/type";

export class TeraPhase extends BattlePhase {
  public pokemon: Pokemon;

  constructor(pokemon: Pokemon) {
    super();

    this.pokemon = pokemon;
  }

  start() {
    super.start();

    console.log(this.pokemon.name, "terastallized to", Type[this.pokemon.teraType].toString()); // TODO: Improve log

    globalScene.queueMessage(getPokemonNameWithAffix(this.pokemon) + " terrastallized into a " + i18next.t(`pokemonInfo:Type.${Type[this.pokemon.teraType]}`) + " type!"); // TODO: Localize this
    // this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.???));

    this.end();
  }


  end() {
    this.pokemon.isTerastallized = true;

    super.end();
  }
}
