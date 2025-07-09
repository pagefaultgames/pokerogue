import { modifierTypes } from "#app/data/data-lists";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { MoveTrackerModifier } from "#app/modifier/modifier";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { getModifierType } from "./modifier-utils";

export function validateShedinjaEvo(): boolean {
  return globalScene.getPlayerParty().length < 6 && globalScene.pokeballCounts[PokeballType.POKEBALL] > 0;
}

/**
 * Increments or creates evolution trackers for mons with USE_MOVE_COUNT evolution conditions
 * @param pokemon {@linkcode Pokemon} that successfully used a move
 * @param moveId {@linkcode MoveId} the move used
 */
export function handleMoveUseTracker(pokemon: Pokemon, moveId: MoveId) {
  if (pokemon.hasSpecies(SpeciesId.PRIMEAPE) && moveId === MoveId.RAGE_FIST) {
    const mod = getModifierType(modifierTypes.EVOLUTION_TRACKER_PRIMEAPE).newModifier(pokemon) as MoveTrackerModifier;
    globalScene.addModifier(mod);
  } else if (pokemon.hasSpecies(SpeciesId.STANTLER) && moveId === MoveId.PSYSHIELD_BASH) {
    const mod = getModifierType(modifierTypes.EVOLUTION_TRACKER_STANTLER).newModifier(pokemon) as MoveTrackerModifier;
    globalScene.addModifier(mod);
  }
}
