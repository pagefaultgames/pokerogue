import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import { PokemonSpecies } from "#data/pokemon-species";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { Starter, StarterMoveset } from "#types/save-data";
import { isBetween, randSeedGauss, randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { chunkString } from "#utils/strings";

export interface DailyRunConfig {
  seed: number;
  starters: Starter;
}
type StarterTuple = [Starter, Starter, Starter];

export function getDailyRunStarters(seed: string): StarterTuple {
  const starters: Starter[] = [];

  globalScene.executeWithSeedOffset(
    () => {
      const eventStarters = getDailyEventSeedStarters(seed);
      if (eventStarters != null) {
        starters.push(...eventStarters);
        return;
      }

      // TODO: explain this math
      const startingLevel = globalScene.gameMode.getStartingLevel();
      const starterCosts: number[] = [];
      starterCosts.push(Math.min(Math.round(3.5 + Math.abs(randSeedGauss(1))), 8));
      starterCosts.push(randSeedInt(9 - starterCosts[0], 1));
      starterCosts.push(10 - (starterCosts[0] + starterCosts[1]));

      for (const cost of starterCosts) {
        const costSpecies = Object.keys(speciesStarterCosts)
          .map(s => Number.parseInt(s) as SpeciesId) // TODO: Remove
          .filter(s => speciesStarterCosts[s] === cost);
        const randPkmSpecies = getPokemonSpecies(randSeedItem(costSpecies));
        const starterSpecies = getPokemonSpecies(
          randPkmSpecies.getTrainerSpeciesForLevel(startingLevel, true, PartyMemberStrength.STRONGER),
        );
        starters.push(getDailyRunStarter(starterSpecies, startingLevel));
      }
    },
    0,
    seed,
  );

  setDailyRunEventStarterMovesets(seed, starters as StarterTuple);

  return starters as StarterTuple;
}

// TODO: Refactor this unmaintainable mess
function getDailyRunStarter(starterSpeciesForm: PokemonSpeciesForm, startingLevel: number, variant?: Variant): Starter {
  const starterSpecies =
    starterSpeciesForm instanceof PokemonSpecies ? starterSpeciesForm : getPokemonSpecies(starterSpeciesForm.speciesId);
  const formIndex = starterSpeciesForm instanceof PokemonSpecies ? undefined : starterSpeciesForm.formIndex;
  const pokemon = globalScene.addPlayerPokemon(
    starterSpecies,
    startingLevel,
    undefined,
    formIndex,
    undefined,
    variant != null,
    variant,
  );
  const starter: Starter = {
    speciesId: starterSpecies.speciesId,
    shiny: pokemon.shiny,
    variant: pokemon.variant,
    formIndex: pokemon.formIndex,
    ivs: pokemon.ivs,
    abilityIndex: pokemon.abilityIndex,
    passive: false,
    nature: pokemon.getNature(),
    pokerus: pokemon.pokerus,
  };
  pokemon.destroy();
  return starter;
}

interface BiomeWeights {
  [key: number]: number;
}

// Initially weighted by amount of exits each biome has
// Town and End are set to 0 however
// And some other biomes were balanced +1/-1 based on average size of the total daily.
const dailyBiomeWeights: BiomeWeights = {
  [BiomeId.CAVE]: 3,
  [BiomeId.LAKE]: 3,
  [BiomeId.PLAINS]: 3,
  [BiomeId.SNOWY_FOREST]: 3,
  [BiomeId.SWAMP]: 3, // 2 -> 3
  [BiomeId.TALL_GRASS]: 3, // 2 -> 3

  [BiomeId.ABYSS]: 2, // 3 -> 2
  [BiomeId.RUINS]: 2,
  [BiomeId.BADLANDS]: 2,
  [BiomeId.BEACH]: 2,
  [BiomeId.CONSTRUCTION_SITE]: 2,
  [BiomeId.DESERT]: 2,
  [BiomeId.DOJO]: 2, // 3 -> 2
  [BiomeId.FACTORY]: 2,
  [BiomeId.FAIRY_CAVE]: 2,
  [BiomeId.FOREST]: 2,
  [BiomeId.GRASS]: 2, // 1 -> 2
  [BiomeId.MEADOW]: 2,
  [BiomeId.MOUNTAIN]: 2, // 3 -> 2
  [BiomeId.SEA]: 2,
  [BiomeId.SEABED]: 2,
  [BiomeId.SLUM]: 2,
  [BiomeId.TEMPLE]: 2, // 3 -> 2
  [BiomeId.VOLCANO]: 2,

  [BiomeId.GRAVEYARD]: 1,
  [BiomeId.ICE_CAVE]: 1,
  [BiomeId.ISLAND]: 1,
  [BiomeId.JUNGLE]: 1,
  [BiomeId.LABORATORY]: 1,
  [BiomeId.METROPOLIS]: 1,
  [BiomeId.POWER_PLANT]: 1,
  [BiomeId.SPACE]: 1,
  [BiomeId.WASTELAND]: 1,

  [BiomeId.TOWN]: 0,
  [BiomeId.END]: 0,
};

export function getDailyStartingBiome(): BiomeId {
  const eventBiome = getDailyEventSeedBiome(globalScene.seed);
  if (eventBiome != null) {
    return eventBiome;
  }

  const biomes = getEnumValues(BiomeId).filter(b => b !== BiomeId.TOWN && b !== BiomeId.END);

  let totalWeight = 0;
  const biomeThresholds: number[] = [];
  for (const biome of biomes) {
    // Keep track of the total weight
    totalWeight += dailyBiomeWeights[biome];

    // Keep track of each biomes cumulative weight
    biomeThresholds.push(totalWeight);
  }

  const randInt = randSeedInt(totalWeight);

  for (let i = 0; i < biomes.length; i++) {
    if (randInt < biomeThresholds[i]) {
      return biomes[i];
    }
  }

  // Fallback in case something went wrong
  // TODO: should this use `randSeedItem`?
  return biomes[randSeedInt(biomes.length)];
}

/**
 * If this is Daily Mode and the seed is longer than a default seed
 * then it has been modified and could contain a custom event seed. \
 * Default seeds are always exactly 24 characters.
 * @returns `true` if it is a Daily Event Seed.
 */
export function isDailyEventSeed(seed: string): boolean {
  return globalScene.gameMode.isDaily && seed.length > 24;
}

/**
 * The length of a single numeric Move ID string.
 * Must be updated whenever the `MoveId` enum gets a new digit!
 */
const MOVE_ID_STRING_LENGTH = 4;
/**
 * The regex literal used to parse daily run custom movesets.
 * @privateRemarks
 * Intentionally does not use the `g` flag to avoid altering `lastIndex` after each match.
 */
const MOVE_ID_SEED_REGEX = /(?<=\/moves)((?:\d{4}){0,4})(?:,((?:\d{4}){0,4}))?(?:,((?:\d{4}){0,4}))?/;

/**
 * Perform moveset post-processing on Daily run starters. \
 * If the seed matches {@linkcode MOVE_ID_SEED_REGEX},
 * the extracted Move IDs will be used to populate the starters' moveset instead.
 * @param seed - The daily run seed
 * @param starters - The previously generated starters; will have movesets mutated in place
 */
function setDailyRunEventStarterMovesets(seed: string, starters: StarterTuple): void {
  const moveMatch: readonly string[] = MOVE_ID_SEED_REGEX.exec(seed)?.slice(1) ?? [];
  if (moveMatch.length === 0) {
    return;
  }

  if (!isBetween(moveMatch.length, 1, 3)) {
    console.error(
      "Invalid custom seeded moveset used for daily run seed!\nSeed: %s\nMatch contents: %s",
      seed,
      moveMatch,
    );
    return;
  }

  const moveIds = getEnumValues(MoveId);
  for (const [i, moveStr] of moveMatch.entries()) {
    if (!moveStr) {
      // Fallback for empty capture groups from omitted entries
      continue;
    }
    const starter = starters[i];
    const parsedMoveIds = chunkString(moveStr, MOVE_ID_STRING_LENGTH).map(m => Number.parseInt(m) as MoveId);

    if (parsedMoveIds.some(f => !moveIds.includes(f))) {
      console.error("Invalid move IDs used for custom daily run seed moveset on starter %d:", i, parsedMoveIds);
      continue;
    }

    starter.moveset = parsedMoveIds as StarterMoveset;
  }
}

/** The regex literal string used to extract the content of the "starters" block of Daily Run custom seeds. */
const STARTER_SEED_PREFIX_REGEX = /\/starters(.*?)(?:\/|$)/;
/**
 * The regex literal used to parse daily run custom starter information for a single starter. \
 * Contains a 4-digit species ID, as well as an optional 2-digit form index and 1-digit variant.
 *
 * If either of form index or variant are omitted, the starter will default to its species' base form/
 * not be shiny, respectively.
 */
const STARTER_SEED_MATCH_REGEX = /(?:s(?<species>\d{4}))(?:f(?<form>\d{2}))?(?:v(?<variant>\d))?/g;

/**
 * Parse a custom daily run seed into a set of pre-defined starters.
 * @see {@linkcode STARTER_SEED_MATCH_REGEX}
 * @param seed - The daily run seed
 * @returns An array of {@linkcode Starter}s, or `null` if it did not match.
 */
// TODO: Rework this setup into JSON or similar - this is quite hard to maintain
function getDailyEventSeedStarters(seed: string): StarterTuple | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const seedAfterPrefix = seed.split(STARTER_SEED_PREFIX_REGEX)[1] as string | undefined;
  if (!seedAfterPrefix) {
    return null;
  }

  const speciesConfigurations = [...seedAfterPrefix.matchAll(STARTER_SEED_MATCH_REGEX)];

  if (speciesConfigurations.length !== 3) {
    // TODO: Remove legacy fallback code after next hotfix version - this is needed for Oct 31's daily to function
    const legacyStarters = getDailyEventSeedStartersLegacy(seed);
    if (legacyStarters == null) {
      return legacyStarters;
    }
    console.error("Invalid starters used for custom daily run seed!", seed);
    return null;
  }

  const speciesIds = getEnumValues(SpeciesId);
  const starters: Starter[] = [];

  for (const match of speciesConfigurations) {
    const { groups } = match;
    if (!groups) {
      console.error("Invalid seed used for custom daily run starter:", match);
      return null;
    }

    const { species: speciesStr, form: formStr, variant: variantStr } = groups;

    const speciesId = Number.parseInt(speciesStr) as SpeciesId;

    // NB: We check the parsed integer here to exclude SpeciesID.NONE as well as invalid values;
    // other fields only check the string to permit 0 as valid inputs
    if (!speciesId || !speciesIds.includes(speciesId)) {
      console.error("Invalid species ID used for custom daily run starter:", speciesStr);
      return null;
    }

    const starterSpecies = getPokemonSpecies(speciesId);
    // Omitted form index = use base form
    const starterForm = formStr ? starterSpecies.forms[Number.parseInt(formStr)] : starterSpecies;

    if (!starterForm) {
      console.log(starterSpecies.name);
      console.error("Invalid form index used for custom daily run starter:", formStr);
      return null;
    }

    // Get and validate variant
    let variant = (variantStr ? Number.parseInt(variantStr) : undefined) as Variant | undefined;
    if (!isBetween(variant ?? 0, 0, 2)) {
      console.error("Variant used for custom daily run seed starter out of bounds:", variantStr);
      return null;
    }

    // Fall back to default variant if none exists
    if (!starterSpecies.hasVariants() && !!variant) {
      console.warn("Variant for custom daily run seed starter does not exist, using base variant...", variant);
      variant = undefined;
    }

    const startingLevel = globalScene.gameMode.getStartingLevel();
    const starter = getDailyRunStarter(starterForm, startingLevel, variant);
    starters.push(starter);
  }

  return starters as StarterTuple;
}

/**
 * Expects the seed to contain `/starters\d{18}/`
 * where the digits alternate between 4 digits for the species ID and 2 digits for the form index
 * (left padded with `0`s as necessary).
 * @returns An array of {@linkcode Starter}s, or `null` if no valid match.
 */
// TODO: Can be removed after october 31st 2025
function getDailyEventSeedStartersLegacy(seed: string): StarterTuple | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const starters: Starter[] = [];
  const speciesMatch = /starters(\d{4})(\d{2})(\d{4})(\d{2})(\d{4})(\d{2})/g.exec(seed)?.slice(1);

  if (!speciesMatch || speciesMatch.length !== 6) {
    return null;
  }

  // TODO: Move these to server-side validation
  const speciesIds = getEnumValues(SpeciesId);

  // generate each starter in turn
  for (let i = 0; i < 3; i++) {
    const speciesId = Number.parseInt(speciesMatch[2 * i]) as SpeciesId;
    const formIndex = Number.parseInt(speciesMatch[2 * i + 1]);

    if (!speciesIds.includes(speciesId)) {
      console.error("Invalid species ID used for custom daily run seed starter:", speciesId);
      return null;
    }

    const starterForm = getPokemonSpeciesForm(speciesId, formIndex);
    const startingLevel = globalScene.gameMode.getStartingLevel();
    const starter = getDailyRunStarter(starterForm, startingLevel);
    starters.push(starter);
  }

  return starters as StarterTuple;
}

/**
 * Expects the seed to contain `/boss\d{4}\d{2}/`
 * where the first 4 digits are the species ID and the next 2 digits are the form index
 * (left padded with `0`s as necessary).
 * @returns A {@linkcode PokemonSpeciesForm} to be used for the boss, or `null` if no valid match.
 */
export function getDailyEventSeedBoss(seed: string): PokemonSpeciesForm | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const match = /boss(\d{4})(\d{2})/g.exec(seed);
  if (!match || match.length !== 3) {
    return null;
  }

  const speciesId = Number.parseInt(match[1]) as SpeciesId;
  const formIndex = Number.parseInt(match[2]);

  if (!getEnumValues(SpeciesId).includes(speciesId)) {
    console.warn("Invalid species ID used for custom daily run seed boss:", speciesId);
    return null;
  }

  const starterForm = getPokemonSpeciesForm(speciesId, formIndex);
  return starterForm;
}

/**
 * Expects the seed to contain `/boss\d{4}\d{2}\d{2}/`
 * where the first 4 digits are the species ID, the next 2 digits are the form index, and the last 2 digits are the variant.
 * Only the last 2 digits matter for the variant, and it is clamped to 0-2.
 * (left padded with `0`s as necessary).
 * @returns A {@linkcode Variant} to be used for the boss, or `null` if no valid match.
 */
export function getDailyEventSeedBossVariant(seed: string): Variant | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const match = /boss\d{6}(\d{2})/g.exec(seed);
  if (!match || match.length !== 2) {
    return null;
  }

  const variant = Number.parseInt(match[1]) as Variant;
  if (variant > 2) {
    return null;
  }

  return variant;
}

/**
 * Expects the seed to contain `/biome\d{2}/` where the 2 digits are a biome ID (left padded with `0` if necessary).
 * @returns The biome to use or `null` if no valid match.
 */
export function getDailyEventSeedBiome(seed: string): BiomeId | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const match = /biome(\d{2})/g.exec(seed);
  if (!match || match.length !== 2) {
    return null;
  }

  const startingBiome = Number.parseInt(match[1]) as BiomeId;

  if (!getEnumValues(BiomeId).includes(startingBiome)) {
    console.warn("Invalid biome ID used for custom daily run seed:", startingBiome);
    return null;
  }

  return startingBiome;
}

/**
 * Expects the seed to contain `/luck\d{2}/` where the 2 digits are a number between `0` and `14`
 * (left padded with `0` if necessary).
 * @returns The custom luck value or `null` if no valid match.
 */
export function getDailyEventSeedLuck(seed: string): number | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const match = /luck(\d{2})/g.exec(seed);
  if (!match || match.length !== 2) {
    return null;
  }

  const luck = Number.parseInt(match[1]);

  if (luck < 0 || luck > 14) {
    console.warn("Invalid luck value used for custom daily run seed:", luck);
    return null;
  }

  return luck;
}
