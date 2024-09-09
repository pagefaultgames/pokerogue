import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { applyPostSummonAbAttrs, PostSummonAbAttr } from "#app/data/ability.js";
import { ArenaTrapTag } from "#app/data/arena-tag.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { PokemonPhase } from "./pokemon-phase";

export class PostSummonPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.turnCount = 0;
    }
    this.scene.arena.applyTags(ArenaTrapTag, pokemon);
    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon).then(() => this.end());
  }
}
