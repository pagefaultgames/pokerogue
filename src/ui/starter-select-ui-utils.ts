import { VALUE_REDUCTION_MAX } from "#app/constants";
import { globalScene } from "#app/global-scene";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getValueReductionCandyCounts,
  speciesStarterCosts,
} from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { DexAttr } from "#enums/dex-attr";
import { Passive } from "#enums/passive";
import { checkStarterValidForChallenge } from "#utils/challenge-utils";

/**
 * Determines if a passive upgrade is available for the given species ID
 * @param speciesId The ID of the species to check the passive of
 * @returns true if the user has enough candies and a passive has not been unlocked already
 */
export function isPassiveAvailable(speciesId: number): boolean {
  // Get this species ID's starter data
  const starterData = globalScene.gameData.starterData[speciesId];

  return (
    starterData.candyCount >= getPassiveCandyCount(speciesStarterCosts[speciesId]) &&
    !(starterData.passiveAttr & Passive.UNLOCKED)
  );
}

/**
 * Determines if a value reduction upgrade is available for the given species ID
 * @param speciesId The ID of the species to check the value reduction of
 * @returns true if the user has enough candies and all value reductions have not been unlocked already
 */
export function isValueReductionAvailable(speciesId: number): boolean {
  // Get this species ID's starter data
  const starterData = globalScene.gameData.starterData[speciesId];

  return (
    starterData.candyCount >=
      getValueReductionCandyCounts(speciesStarterCosts[speciesId])[starterData.valueReduction] &&
    starterData.valueReduction < VALUE_REDUCTION_MAX
  );
}

/**
 * Determines if an same species egg can be bought for the given species ID
 * @param speciesId The ID of the species to check the value reduction of
 * @returns true if the user has enough candies
 */
export function isSameSpeciesEggAvailable(speciesId: number): boolean {
  // Get this species ID's starter data
  const starterData = globalScene.gameData.starterData[speciesId];

  return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarterCosts[speciesId]);
}

export function isStarterValidForChallenge(species: PokemonSpecies) {
  let allFormsValid = false;
  if (species.forms?.length > 0) {
    for (let i = 0; i < species.forms.length; i++) {
      /* Here we are making a fake form index dex props for challenges
       * Since some pokemon rely on forms to be valid (i.e. blaze tauros for fire challenges), we make a fake form and dex props to use in the challenge
       */
      if (!species.forms[i].isStarterSelectable) {
        continue;
      }
      const tempFormProps = BigInt(Math.pow(2, i)) * DexAttr.DEFAULT_FORM;
      const isValidForChallenge = checkStarterValidForChallenge(
        species,
        globalScene.gameData.getSpeciesDexAttrProps(species, tempFormProps),
        true,
      );
      allFormsValid ||= isValidForChallenge;
    }
  } else {
    const isValidForChallenge = checkStarterValidForChallenge(
      species,
      globalScene.gameData.getSpeciesDexAttrProps(
        species,
        globalScene.gameData.getSpeciesDefaultDexAttr(species, false, true),
      ),
      true,
    );
    allFormsValid = isValidForChallenge;
  }

  return allFormsValid;
}
