import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import { EntryHazardTag } from "#data/arena-tag";
import { MysteryEncounterPostSummonTag } from "#data/battler-tags";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { PokemonPhase } from "#phases/pokemon-phase";

export class PostSummonPhase extends PokemonPhase {
  public readonly phaseName = "PostSummonPhase";
  /** Used to determine whether to push or unshift {@linkcode PostSummonActivateAbilityPhase}s */
  public readonly source: PhaseString;

  constructor(battlerIndex?: BattlerIndex | number, source: PhaseString = "SwitchPhase") {
    super(battlerIndex);
    this.source = source;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    console.log("Ran PSP for:", pokemon.name);
    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.toxicTurnCount = 0;
    }

    globalScene.arena.applyTags(ArenaTagType.PENDING_HEAL, false, pokemon);

    globalScene.arena.applyTags(EntryHazardTag, false, pokemon);

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (
      globalScene.currentBattle.isBattleMysteryEncounter()
      && pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0
    ) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }
    const field = pokemon.isPlayer() ? globalScene.getPlayerField(true) : globalScene.getEnemyField(true);
    for (const p of field) {
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
