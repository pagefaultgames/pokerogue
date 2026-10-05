import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { EntryHazardTag } from "#data/arena-tag";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { PokemonPhase } from "#phases/pokemon-phase";

/**
 * Phase handling logical effects after a Pokemon enters the field.
 */
export class PostSummonPhase extends PokemonPhase {
  public readonly phaseName = "PostSummonPhase";

  start() {
    super.start();

    const pokemon = this.getPokemon();
    console.log("Ran PSP for:", pokemon.name);
    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.toxicTurnCount = 0;
    }

    globalScene.arena.applyTags(ArenaTagType.PENDING_HEAL, false, pokemon);

    globalScene.arena.applyTags(EntryHazardTag, false, pokemon);

    // If this is mystery encounter, apply post summon effects as applicable.
    // (Does nothing if the tag is not present)
    if (globalScene.currentBattle.isBattleMysteryEncounter()) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }
    for (const p of pokemon.getAlliesGenerator()) {
      applyAbAttrs("CommanderAbAttr", { pokemon: p });
    }

    // If the Pokemon takes a different form when active, change its form
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    // Update weather-based forms in case the summoned Pokemon's Cloud Nine activated.
    // Other weather-changing effects are already accounted for.
    // TODO: Make Cloud Nine's ability attribute do this
    globalScene.arena.triggerWeatherBasedFormChanges();

    this.end();
  }

  public getPriority() {
    return 0;
  }
}
