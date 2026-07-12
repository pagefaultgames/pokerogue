import { VALUE_REDUCTION_MAX } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { speciesEggMoves } from "#balance/egg-moves";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getStarterValueFriendshipCap,
  getValueReductionCandyCounts,
} from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { ChallengeType } from "#enums/challenge-type";
import { Challenges } from "#enums/challenges";
import { DexAttr } from "#enums/dex-attr";
import { GameModes } from "#enums/game-modes";
import type { MoveId } from "#enums/move-id";
import { Passive } from "#enums/passive";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { DexEntry } from "#types/dex-data";
import type { DexAttrProps, StarterDataEntry, StarterPreferences } from "#types/save-data";
import type { StarterSpeciesId } from "#types/starter-species-id";
import { SortCriteria, type SortDirection } from "#ui/dropdown";
import { applyChallenges, checkStarterValidForChallenge } from "#utils/challenge-utils";
import { NumberHolder } from "#utils/common";
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

export interface CanCycle {
  ability?: boolean | undefined;
  form?: boolean | undefined;
  gender?: boolean | undefined;
  shiny?: boolean | undefined;
  nature?: boolean | undefined;
  tera?: boolean | undefined;
}

/**
 * Determines if a passive upgrade is available for the given species ID
 * @param speciesId - The ID of the species to check the passive of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies and a passive has not been unlocked already
 */
export function isPassiveAvailable(speciesId: number, gameData = globalScene.gameData): boolean {
  // Get this species ID's starter data
  const starterId = speciesDataRegistry.getStarter(speciesId);
  const starterData = gameData.starterData[starterId];

  return (
    starterData.candyCount >= getPassiveCandyCount(speciesDataRegistry.getStarterCost(starterId))
    && !(starterData.passiveAttr & Passive.UNLOCKED)
  );
}

/**
 * Determines if a value reduction upgrade is available for the given species ID
 * @param speciesId - The ID of the species to check the value reduction of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies and all value reductions have not been unlocked already
 */
export function isValueReductionAvailable(speciesId: number, gameData = globalScene.gameData): boolean {
  const starterId = speciesDataRegistry.getStarter(speciesId);
  const starterData = gameData.starterData[starterId];

  return (
    starterData.candyCount
      >= getValueReductionCandyCounts(speciesDataRegistry.getStarterCost(starterId))[starterData.valueReduction]
    && starterData.valueReduction < VALUE_REDUCTION_MAX
  );
}

/**
 * Determines if an egg for the same starter can be bought for the given species ID
 * @param speciesId - The ID of the species to check the value reduction of
 * @param gameData - Optional game data, defaults to the data in globalScene
 * @returns true if the user has enough candies
 */
export function isSameSpeciesEggAvailable(speciesId: number, gameData = globalScene.gameData): boolean {
  const starterId = speciesDataRegistry.getStarter(speciesId);
  const hatchCount = gameData.dexData[starterId].hatchedCount;
  return (
    gameData.starterData[starterId].candyCount
    >= getSameSpeciesEggCandyCounts(speciesDataRegistry.getStarterCost(starterId), hatchCount)
  );
}

/**
 * Determines if a starter is valid for challenges.
 * @param starterId - The ID of the starter species to check
 * @returns whether the starter is valid for challenges
 */
export function isStarterValidForChallenge(starterId: StarterSpeciesId): boolean {
  const species = speciesDataRegistry.getSpecies(starterId);

  let isStarterValid = false;
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
      isStarterValid ||= isValidForChallenge;
    }
  } else {
    const isValidForChallenge = checkStarterValidForChallenge(
      starterId,
      globalScene.gameData.getSpeciesDefaultDexAttrProps(species.speciesId),
      true,
    );
    isStarterValid = isValidForChallenge;
  }

  return isStarterValid;
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
    instructionTextSize: "28px",
  },
  de: {
    starterInfoTextSize: "54px",
    instructionTextSize: "25px",
    starterInfoXPos: 35,
  },
  "es-ES": {
    starterInfoTextSize: "52px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 39,
  },
  "es-419": {
    starterInfoTextSize: "50px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 37,
  },
  fr: {
    starterInfoTextSize: "54px",
    instructionTextSize: "28px",
  },
  it: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
  },
  "pt-BR": {
    starterInfoTextSize: "54px",
    instructionTextSize: "28px",
    starterInfoXPos: 37,
  },
  zh: {
    starterInfoTextSize: "56px",
    instructionTextSize: "26px",
    starterInfoXPos: 26,
  },
  ko: {
    starterInfoTextSize: "60px",
    instructionTextSize: "28px",
    starterInfoYOffset: -0.5,
    starterInfoXPos: 30,
  },
  ja: {
    starterInfoTextSize: "48px",
    instructionTextSize: "32px",
    starterInfoYOffset: 1,
    starterInfoXPos: 32,
  },
  ca: {
    starterInfoTextSize: "48px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 29,
  },
  eu: {
    starterInfoTextSize: "48px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 29,
  },
  da: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
  },
  th: {
    starterInfoTextSize: "50px",
    instructionTextSize: "30px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 40,
  },
  tr: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
    starterInfoXPos: 34,
  },
  pl: {
    starterInfoTextSize: "48px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
  },
  ru: {
    starterInfoTextSize: "46px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 26,
  },
  uk: {
    starterInfoTextSize: "46px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 26,
  },
  id: {
    starterInfoTextSize: "48px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 37,
  },
  hi: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
  },
  vi: {
    starterInfoTextSize: "50px",
    instructionTextSize: "28px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 34,
  },
  tl: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
  },
  sv: {
    starterInfoTextSize: "56px",
    instructionTextSize: "28px",
  },
};

export function getStarterSelectTextSettings(): StarterSelectLanguageSetting {
  const currentLanguage = i18next.resolvedLanguage ?? "en";
  const textSettings = languageSettings[currentLanguage] ?? languageSettings["en"];
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

/**
 * Get the current friendship and friendship cap for a given species.
 * @param speciesId - The id of the species to get friendship for
 * @returns An object containing the current friendship and friendship cap for the species
 */
export function getFriendship(speciesId: SpeciesId): { currentFriendship: number; friendshipCap: number } {
  let currentFriendship = globalScene.gameData.starterData[speciesId].friendship;
  if (!currentFriendship || currentFriendship === undefined) {
    currentFriendship = 0;
  }

  const friendshipCap = getStarterValueFriendshipCap(speciesDataRegistry.getStarterCost(speciesId));

  return { currentFriendship, friendshipCap };
}

/**
 * Creates a temporary dex attr props that will be used to check whether a pokemon is valid for a challenge
 * and to display the correct shiny, variant, and form based on the AllStarterPreferences
 *
 * @param speciesId - The id of the species to get props for
 * @returns the dex props
 */
export function getDexAttrFromPreferences(
  speciesId: StarterSpeciesId,
  starterPreferences: StarterPreferences = {},
): bigint {
  let props = 0n;
  const { dexEntry } = getStarterData(speciesId);
  const caughtAttr = dexEntry.caughtAttr;

  /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
   *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
   *  If neither of these pass, we add DexAttr.MALE to our temp props
   */
  if (starterPreferences.female || ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)) {
    props += DexAttr.FEMALE;
  } else {
    props += DexAttr.MALE;
  }
  /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
   * If they're not there, it enables shiny state by default if any shiny was caught
   */
  if (
    starterPreferences.shiny
    || ((caughtAttr & DexAttr.SHINY) > 0n && starterPreferences[speciesId]?.shiny !== false)
  ) {
    props += DexAttr.SHINY;
    if (starterPreferences.variant !== undefined) {
      props += BigInt(Math.pow(2, starterPreferences.variant)) * DexAttr.DEFAULT_VARIANT;
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
  if (starterPreferences.formIndex) {
    // this checks for the form of the pokemon
    props += BigInt(Math.pow(2, starterPreferences.formIndex)) * DexAttr.DEFAULT_FORM;
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
  // Shiny is always default, except in fresh start
  const shinyIsDefault = !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);
  const defaults = globalScene.gameData.getSpeciesDefaultDexAttrProps(starterId, shinyIsDefault);
  return {
    shiny: starterPreferences.shiny == null ? defaults.shiny : starterPreferences.shiny,
    variant: starterPreferences.variant == null ? defaults.variant : (starterPreferences.variant as Variant),
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
) {
  const props = getStarterDexAttrPropsFromPreferences(starterId, starterPreferences);
  const species = speciesDataRegistry.getSpecies(starterId);
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

/**
 * Get the limit on starter points available for the current run.
 * @returns the limit on starter points taking challenges into account
 */
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

/**
 * Calculate the total value of a given party.
 * @param party - An array of species IDs representing the player's starter party
 * @returns The total value of the party
 */
export function getPartyValue(party: StarterSpeciesId[]) {
  return party.reduce(
    (total: number, starterId: StarterSpeciesId) => total + globalScene.gameData.getSpeciesStarterValue(starterId),
    0,
  );
}

/**
 * Sort an array of {@linkcode StarterSpeciesId | species IDs} based on a given criteria and direction.
 * @param speciesIds - An array of species IDs to be sorted
 * @param sort - The criteria by which the species hould be sorted
 * @param dir - The direction in which the species should be sorted
 */
export function sortStarterSpecies(speciesIds: StarterSpeciesId[], sort: SortCriteria, dir: SortDirection): void {
  speciesIds.sort((a, b) => {
    switch (sort) {
      case SortCriteria.NUMBER:
        return (a - b) * -dir;
      case SortCriteria.COST:
        return (globalScene.gameData.getSpeciesStarterValue(a) - globalScene.gameData.getSpeciesStarterValue(b)) * -dir;
      case SortCriteria.CANDY: {
        const candyCountA = globalScene.gameData.starterData[a].candyCount;
        const candyCountB = globalScene.gameData.starterData[b].candyCount;
        return (candyCountA - candyCountB) * -dir;
      }
      case SortCriteria.IV: {
        const avgIVsA =
          globalScene.gameData.dexData[a].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[a].ivs.length;
        const avgIVsB =
          globalScene.gameData.dexData[b].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[b].ivs.length;
        return (avgIVsA - avgIVsB) * -dir;
      }
      case SortCriteria.NAME:
        return speciesDataRegistry.getSpecies(a).name.localeCompare(speciesDataRegistry.getSpecies(b).name) * -dir;
      case SortCriteria.CAUGHT:
        return (globalScene.gameData.dexData[a].caughtCount - globalScene.gameData.dexData[b].caughtCount) * -dir;
      case SortCriteria.HATCHED:
        return (globalScene.gameData.dexData[a].hatchedCount - globalScene.gameData.dexData[b].hatchedCount) * -dir;
    }
    return 0;
  });
}

/**
 * Get the moves that a starter can have.
 * @param starterId - The id of the starter species to get moves for
 * @param formIndex - The form index of the starter to get moves for
 * @returns An array of move IDs
 */
export function getStarterMoves(starterId: StarterSpeciesId, formIndex: number): MoveId[] {
  const starterMoves: MoveId[] = [];
  const { starterDataEntry } = getStarterData(starterId);

  const levelMoves = speciesDataRegistry.getLevelMoves(starterId, formIndex);
  for (const [level, moveId] of levelMoves) {
    if (level > 0 && level <= 5) {
      starterMoves.push(moveId);
    }
  }
  if (Object.hasOwn(speciesEggMoves, starterId)) {
    for (let em = 0; em < 4; em++) {
      if (starterDataEntry.eggMoves & (1 << em)) {
        starterMoves.push(speciesEggMoves[starterId][em]);
      }
    }
  }

  return starterMoves;
}
