import { VALUE_REDUCTION_MAX } from "#app/constants";
import { globalScene } from "#app/global-scene";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getStarterValueFriendshipCap,
  getValueReductionCandyCounts,
  speciesStarterCosts,
} from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { ChallengeType } from "#enums/challenge-type";
import { DexAttr } from "#enums/dex-attr";
import { Passive } from "#enums/passive";
import type { SpeciesId } from "#enums/species-id";
import type { StarterDataEntry } from "#system/game-data";
import type { DexEntry } from "#types/dex-data";
import { applyChallenges, checkStarterValidForChallenge } from "#utils/challenge-utils";
import i18next from "i18next";

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

/**
 * Determines if 'Icon' based upgrade notifications should be shown
 * @returns true if upgrade notifications are enabled and set to display an 'Icon'
 */
export function isUpgradeIconEnabled(): boolean {
  return globalScene.candyUpgradeNotification !== 0 && globalScene.candyUpgradeDisplay === 0;
}

/**
 * Determines if 'Animation' based upgrade notifications should be shown
 * @returns true if upgrade notifications are enabled and set to display an 'Animation'
 */
export function isUpgradeAnimationEnabled(): boolean {
  return globalScene.candyUpgradeNotification !== 0 && globalScene.candyUpgradeDisplay === 1;
}

interface StarterSelectLanguageSetting {
  starterInfoTextSize: string;
  instructionTextSize: string;
  starterInfoXPos?: number;
  starterInfoYOffset?: number;
}

const languageSettings: { [key: string]: StarterSelectLanguageSetting } = {
  en: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  de: {
    starterInfoTextSize: "54px",
    instructionTextSize: "35px",
    starterInfoXPos: 35,
  },
  "es-ES": {
    starterInfoTextSize: "50px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 38,
  },
  "es-MX": {
    starterInfoTextSize: "50px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 38,
  },
  fr: {
    starterInfoTextSize: "54px",
    instructionTextSize: "38px",
  },
  it: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "pt-BR": {
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 33,
  },
  zh: {
    starterInfoTextSize: "56px",
    instructionTextSize: "36px",
    starterInfoXPos: 26,
  },
  ko: {
    starterInfoTextSize: "60px",
    instructionTextSize: "38px",
    starterInfoYOffset: -0.5,
    starterInfoXPos: 30,
  },
  ja: {
    starterInfoTextSize: "48px",
    instructionTextSize: "40px",
    starterInfoYOffset: 1,
    starterInfoXPos: 32,
  },
  ca: {
    starterInfoTextSize: "48px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 29,
  },
  da: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  tr: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  ro: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  ru: {
    starterInfoTextSize: "46px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 26,
  },
  tl: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
};

export function getStarterSelectTextSettings(): StarterSelectLanguageSetting {
  const currentLanguage = i18next.resolvedLanguage ?? "en";
  const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang)) ?? "en";
  const textSettings = languageSettings[langSettingKey];
  return textSettings;
}

export function getSpeciesData(
  speciesId: SpeciesId,
  applyChallenge = true,
): { dexEntry: DexEntry; starterDataEntry: StarterDataEntry } {
  const dexEntry = globalScene.gameData.dexData[speciesId];
  const starterDataEntry = globalScene.gameData.starterData[speciesId];

  // Unpacking to make a copy by values, not references
  const copiedDexEntry = { ...dexEntry };
  copiedDexEntry.ivs = [...dexEntry.ivs];
  const copiedStarterDataEntry = { ...starterDataEntry };
  if (applyChallenge) {
    applyChallenges(ChallengeType.STARTER_SELECT_MODIFY, speciesId, copiedDexEntry, copiedStarterDataEntry);
  }
  return { dexEntry: { ...copiedDexEntry }, starterDataEntry: { ...copiedStarterDataEntry } };
}

export function getFriendship(speciesId: number) {
  let currentFriendship = globalScene.gameData.starterData[speciesId].friendship;
  if (!currentFriendship || currentFriendship === undefined) {
    currentFriendship = 0;
  }

  const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[speciesId]);

  return { currentFriendship, friendshipCap };
}
