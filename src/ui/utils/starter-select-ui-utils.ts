import { VALUE_REDUCTION_MAX } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { pokemonStarters } from "#balance/pokemon-evolutions";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getStarterValueFriendshipCap,
  getValueReductionCandyCounts,
  type StarterSpeciesId,
  speciesStarterCosts,
} from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { ChallengeType } from "#enums/challenge-type";
import { DexAttr } from "#enums/dex-attr";
import { GameModes } from "#enums/game-modes";
import { Passive } from "#enums/passive";
import type { PokemonType } from "#enums/pokemon-type";
import type { Variant } from "#sprites/variant";
import type { GameData } from "#system/game-data";
import type { DexEntry } from "#types/dex-data";
import type { DexAttrProps, StarterDataEntry, StarterPreferences } from "#types/save-data";
import { applyChallenges, checkStarterValidForChallenge } from "#utils/challenge-utils";
import { NumberHolder } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export interface SpeciesDetails {
  shiny?: boolean | undefined;
  formIndex?: number | undefined;
  female?: boolean | undefined;
  variant?: Variant | undefined;
  abilityIndex?: number | undefined;
  natureIndex?: number | undefined;
  teraType?: PokemonType | undefined;
}

export function getStarterSpeciesId(speciesId: number): number {
  if (speciesStarterCosts.hasOwnProperty(speciesId)) {
    return speciesId;
  }
  return pokemonStarters[speciesId];
}

/**
 * Determines if a passive upgrade is available for the given species ID
 * @param speciesId - The ID of the species to check the passive of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies and a passive has not been unlocked already
 */
export function isPassiveAvailable(speciesId: number, gameData?: GameData): boolean {
  // Get this species ID's starter data
  const starterId = getStarterSpeciesId(speciesId);
  gameData ??= globalScene.gameData;
  const starterData = gameData.starterData[starterId];

  return (
    starterData.candyCount >= getPassiveCandyCount(speciesStarterCosts[starterId])
    && !(starterData.passiveAttr & Passive.UNLOCKED)
  );
}

/**
 * Determines if a value reduction upgrade is available for the given species ID
 * @param speciesId - The ID of the species to check the value reduction of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies and all value reductions have not been unlocked already
 */
export function isValueReductionAvailable(speciesId: number, gameData?: GameData): boolean {
  const starterId = getStarterSpeciesId(speciesId);
  gameData ??= globalScene.gameData;
  const starterData = gameData.starterData[starterId];

  return (
    starterData.candyCount >= getValueReductionCandyCounts(speciesStarterCosts[starterId])[starterData.valueReduction]
    && starterData.valueReduction < VALUE_REDUCTION_MAX
  );
}

/**
 * Determines if an egg for the same starter can be bought for the given species ID
 * @param speciesId - The ID of the species to check the value reduction of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies
 */
export function isSameSpeciesEggAvailable(speciesId: number, gameData?: GameData): boolean {
  gameData ??= globalScene.gameData;

  const starterId = getStarterSpeciesId(speciesId);
  const hatchCount = globalScene.gameData.dexData[starterId].hatchedCount;
  return (
    gameData.starterData[starterId].candyCount
    >= getSameSpeciesEggCandyCounts(speciesStarterCosts[starterId], hatchCount)
  );
}

export function isStarterValidForChallenge(starterId: StarterSpeciesId) {
  const species = getPokemonSpecies(starterId);

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
        starterId,
        globalScene.gameData.getDexAttrProps(tempFormProps),
        true,
      );
      allFormsValid ||= isValidForChallenge;
    }
  } else {
    const isValidForChallenge = checkStarterValidForChallenge(
      starterId,
      globalScene.gameData.getDexAttrProps(globalScene.gameData.getSpeciesDefaultDexAttr(starterId, false, true)),
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
  "es-419": {
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
    starterInfoXPos: 34,
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
  uk: {
    starterInfoTextSize: "46px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 26,
  },
  id: {
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 37,
  },
  hi: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  tl: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "nb-NO": {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  sv: {
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

/**
 * Return a copy of the dex data and starter data for a given species,
 * sanitizing it by applying any challenges that restrict which options should be available.
 *
 * @param speciesId - The species id to get data for
 * @param applyChallenge - Whether the current challenge should be taken into account
 * @returns StarterPreferences for the species
 */
export function getStarterData(
  starterId: StarterSpeciesId,
  applyChallenge = true,
): { dexEntry: DexEntry; starterDataEntry: StarterDataEntry } {
  const dexEntry = globalScene.gameData.dexData[starterId];
  const starterDataEntry = globalScene.gameData.starterData[starterId];

  // Unpacking to make a copy by values, not references
  const copiedDexEntry = { ...dexEntry };
  copiedDexEntry.ivs = [...dexEntry.ivs];
  const copiedStarterDataEntry = { ...starterDataEntry };
  if (applyChallenge) {
    applyChallenges(ChallengeType.STARTER_SELECT_MODIFY, starterId, copiedDexEntry, copiedStarterDataEntry);
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
 * @param speciesId - The id of the species to get props for
 * @returns the dex props
 */
export function getDexAttrFromPreferences(speciesId: number, starterPreferences: StarterPreferences = {}): bigint {
  let props = 0n;
  const { dexEntry } = getStarterData(speciesId);
  const caughtAttr = dexEntry.caughtAttr;

  /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
   *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
   *  If neither of these pass, we add DexAttr.MALE to our temp props
   */
  if (
    starterPreferences[speciesId]?.female
    || ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)
  ) {
    props += DexAttr.FEMALE;
  } else {
    props += DexAttr.MALE;
  }
  /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
   * If they're not there, it enables shiny state by default if any shiny was caught
   */
  if (
    starterPreferences[speciesId]?.shiny
    || ((caughtAttr & DexAttr.SHINY) > 0n && starterPreferences[speciesId]?.shiny !== false)
  ) {
    props += DexAttr.SHINY;
    if (starterPreferences[speciesId]?.variant !== undefined) {
      props += BigInt(Math.pow(2, starterPreferences[speciesId]?.variant)) * DexAttr.DEFAULT_VARIANT;
    } else if ((caughtAttr & DexAttr.VARIANT_3) > 0) {
      props += DexAttr.VARIANT_3;
    } else if ((caughtAttr & DexAttr.VARIANT_2) > 0) {
      props += DexAttr.VARIANT_2;
    } else {
      props += DexAttr.DEFAULT_VARIANT;
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

/**
 * Convert starter preferences to {@linkcode DexAttrProps | dex props}, which are used as an input by various functions.
 * If any preferences are undefined, the default value for the species is given, based on its caught data.
 * @param species - The {@linkcode PokemonSpecies} for which dex props are required.
 * @param starterPreferences - The {@linkcode StarterPreferences | starter preferences} for the species.
 */
export function getStarterDexAttrPropsFromPreferences(
  starterId: StarterSpeciesId,
  starterPreferences: StarterPreferences = {},
): DexAttrProps {
  const defaults = globalScene.gameData.getSpeciesDefaultDexAttrProps(starterId);
  return {
    shiny: starterPreferences.shiny != null ? starterPreferences.shiny : defaults.shiny,
    variant: starterPreferences.variant != null ? (starterPreferences.variant as Variant) : defaults.variant,
    female: starterPreferences.female ?? defaults.female,
    formIndex: starterPreferences.formIndex ?? defaults.formIndex,
  };
}

/**
 * Convert starter preferences to {@linkcode SpeciesDetails | species details}.
 * If any preferences are undefined, the default value for the species is given, based on its caught data.
 * @param species - The {@linkcode PokemonSpecies} for which species details are required.
 * @param starterPreferences - The {@linkcode StarterPreferences | starter preferences} for the species.
 */
export function getStarterDetailsFromPreferences(
  starterId: StarterSpeciesId,
  starterPreferences: StarterPreferences = {},
): SpeciesDetails {
  const props = getStarterDexAttrPropsFromPreferences(starterId, starterPreferences);
  const species = getPokemonSpecies(starterId);
  const abilityIndex =
    starterPreferences?.abilityIndex ?? globalScene.gameData.getStarterDefaultAbilityIndex(starterId);
  const nature = starterPreferences?.nature ?? globalScene.gameData.getSpeciesDefaultNature(starterId);
  const teraType = starterPreferences?.tera ?? species.type1;
  return {
    shiny: props.shiny,
    formIndex: props.formIndex,
    female: props.female,
    variant: props.variant,
    abilityIndex,
    natureIndex: nature,
    teraType,
  };
}

export function getRunValueLimit(): number {
  const valueLimit = new NumberHolder(0);
  switch (globalScene.gameMode.modeId) {
    case GameModes.ENDLESS:
    case GameModes.SPLICED_ENDLESS:
      valueLimit.value = 15;
      break;
    default:
      valueLimit.value = 10;
  }

  applyChallenges(ChallengeType.STARTER_POINTS, valueLimit);

  return valueLimit.value;
}
