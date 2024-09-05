import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { applyPostSummonAbAttrs, PostSummonAbAttr } from "#app/data/ability.js";
import { ArenaTrapTag } from "#app/data/arena-tag.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { PokemonPhase } from "./pokemon-phase";
import { MysteryEncounterPostSummonTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BattleType } from "#app/battle";

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

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (this.scene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER && pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }

    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon).then(() => this.end());
  }
}
