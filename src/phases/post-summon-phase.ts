import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import { EntryHazardTag } from "#data/arena-tag";
import { MysteryEncounterPostSummonTag } from "#data/battler-tags";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { PokemonPhase } from "#phases/pokemon-phase";

export class PostSummonPhase extends PokemonPhase {
  public readonly phaseName = "PostSummonPhase";
  /** Used to determine whether to push or unshift PostSummonActivateAbilityPhases  */
  public readonly source: PhaseString;

  constructor(battlerIndex?: BattlerIndex | number, source: PhaseString = "SwitchSummonPhase") {
    super(battlerIndex);
    this.source = source;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    console.log("Ran PSP for:");
    console.log(pokemon.name);
    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.toxicTurnCount = 0;
    }
    globalScene.arena.applyTags(EntryHazardTag, false, pokemon);

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (
      globalScene.currentBattle.isBattleMysteryEncounter() &&
      pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0
    ) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }

    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      if (p.isActive(true)) {
        applyAbAttrs("CommanderAbAttr", { pokemon: p });
      }
    }

    this.end();
  }

  public getPriority() {
    return 0;
  }
}
