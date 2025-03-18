import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostSummonAbAttrs, CommanderAbAttr, PostSummonAbAttr } from "#app/data/ability";
import { ArenaTrapTag } from "#app/data/arena-tag";
import { StatusEffect } from "#app/enums/status-effect";
import { PokemonPhase } from "./pokemon-phase";
import { MysteryEncounterPostSummonTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";

export class PostSummonPhase extends PokemonPhase {
  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.toxicTurnCount = 0;
    }
    globalScene.arena.applyTags(ArenaTrapTag, false, pokemon);

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (
      globalScene.currentBattle.isBattleMysteryEncounter() &&
      pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0
    ) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }

    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs(CommanderAbAttr, p, null, false);
    }

    this.end();
  }

  public getPriority() {
    return 0;
  }
}

/**
 * Phase to apply (post-summon) ability attributes for abilities with nonzero priority
 *
 * Priority abilities activate before others and before hazards
 *
 * @see Example - {@link https://bulbapedia.bulbagarden.net/wiki/Neutralizing_Gas_(Ability) | Neutralizing Gas}
 */
export class PostSummonActivateAbilityPhase extends PostSummonPhase {
  private priority: number;

  constructor(battlerIndex: BattlerIndex, priority: number) {
    super(battlerIndex);
    this.priority = priority;
  }

  start() {
    applyPostSummonAbAttrs(PostSummonAbAttr, this.getPokemon(), false, (p: number) => p === this.priority);

    this.end();
  }

  public override getPriority() {
    return this.priority;
  }
}
