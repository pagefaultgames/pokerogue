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
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { StarterDataEntry, StarterPreferences } from "#system/game-data";
import type { DexEntry } from "#types/dex-data";
import { applyChallenges, checkStarterValidForChallenge } from "#utils/challenge-utils";
import i18next from "i18next";

export interface SpeciesDetails {
  shiny?: boolean;
  formIndex?: number;
  female?: boolean;
  variant?: Variant;
  abilityIndex?: number;
  natureIndex?: number;
  teraType?: PokemonType;
}

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

/**
 * Creates a temporary dex attr props that will be used to check whether a pokemon is valid for a challenge
 * and to display the correct shiny, variant, and form based on the AllStarterPreferences
 *
 * @param speciesId the id of the species to get props for
 * @returns the dex props
 */
export function getDexAttrFromPreferences(speciesId: number, starterPreferences: StarterPreferences = {}): bigint {
  let props = 0n;
  const { dexEntry } = getSpeciesData(speciesId);
  const caughtAttr = dexEntry.caughtAttr;

  /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
   *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
   *  If neither of these pass, we add DexAttr.MALE to our temp props
   */
  if (
    starterPreferences[speciesId]?.female ||
    ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)
  ) {
    props += DexAttr.FEMALE;
  } else {
    props += DexAttr.MALE;
  }
  /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
   * If they're not there, it enables shiny state by default if any shiny was caught
   */
  if (
    starterPreferences[speciesId]?.shiny ||
    ((caughtAttr & DexAttr.SHINY) > 0n && starterPreferences[speciesId]?.shiny !== false)
  ) {
    props += DexAttr.SHINY;
    if (starterPreferences[speciesId]?.variant !== undefined) {
      props += BigInt(Math.pow(2, starterPreferences[speciesId]?.variant)) * DexAttr.DEFAULT_VARIANT;
    } else {
      /*  This calculates the correct variant if there's no starter preferences for it.
       *  This gets the highest tier variant that you've caught and adds it to the temp props
       */
      if ((caughtAttr & DexAttr.VARIANT_3) > 0) {
        props += DexAttr.VARIANT_3;
      } else if ((caughtAttr & DexAttr.VARIANT_2) > 0) {
        props += DexAttr.VARIANT_2;
      } else {
        props += DexAttr.DEFAULT_VARIANT;
      }
    }
  } else {
    props += DexAttr.NON_SHINY;
    props += DexAttr.DEFAULT_VARIANT; // we add the default variant here because non shiny versions are listed as default variant
  }
  if (starterPreferences[speciesId]?.form) {
    // this checks for the form of the pokemon
    props += BigInt(Math.pow(2, starterPreferences[speciesId]?.form)) * DexAttr.DEFAULT_FORM;
  } else {
    // Get the first unlocked form
    props += globalScene.gameData.getFormAttr(globalScene.gameData.getFormIndex(caughtAttr));
  }

  return props;
}
