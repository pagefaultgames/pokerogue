import { globalScene } from "#app/global-scene";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import type { SpeciesId } from "#enums/species-id";
import type { RibbonFlag } from "#system/ribbons/ribbon-data";
import { isNullOrUndefined } from "#utils/common";

/**
 * Award one or more ribbons to a species and its pre-evolutions
 *
 * @param id - The ID of the species to award ribbons to
 * @param ribbons - The ribbon(s) to award (use bitwise OR to combine multiple)
 */
export function awardRibbonsToSpeciesLine(id: SpeciesId, ribbons: RibbonFlag): void {
  const dexData = globalScene.gameData.dexData;
  dexData[id].ribbons.award(ribbons);
  // Mark all pre-evolutions of the Pokémon with the same ribbon flags.
  for (let prevoId = pokemonPrevolutions[id]; !isNullOrUndefined(prevoId); prevoId = pokemonPrevolutions[prevoId]) {
    dexData[prevoId].ribbons.award(ribbons);
  }
}
