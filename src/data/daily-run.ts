import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import { PokemonSpecies } from "#data/pokemon-species";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { CustomDailyRunConfig, DailySeedBoss } from "#types/daily-run";
import type { Starter, StarterMoveset } from "#types/save-data";
import { isBetween, randSeedGauss, randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { chunkString } from "#utils/strings";
import { dailyBiomeWeights } from "./daily-biome-weights";

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
 * If this is Daily Mode and the seed can be parsed into json it is a Daily Event Seed.
 * @returns `true` if it is a Daily Event Seed.
 */
export function isDailyEventSeed(seed: string): boolean {
  return globalScene.gameMode.isDaily && parseDailySeed(seed) != null;
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
 * Expects the seed to contain the `boss` property.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The {@linkcode DailySeedBoss} to use or `null` if there is no boss config or the {@linkcode SpeciesId} is invalid.
 */
export function getDailyEventSeedBoss(seed: string): DailySeedBoss | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const bossConfig = parseDailySeed(seed)?.boss;
  if (!bossConfig) {
    return null;
  }

  if (!getEnumValues(SpeciesId).includes(bossConfig.speciesId)) {
    console.warn("Invalid species ID used for custom daily run seed boss:", bossConfig.speciesId);
    return null;
  }

  if (bossConfig.formIndex != null) {
    const speciesForm = getPokemonSpeciesForm(bossConfig.speciesId, bossConfig.formIndex);
    bossConfig.formIndex = speciesForm.formIndex;
  }

  if (bossConfig.variant != null && !isBetween(bossConfig.variant, 0, 2)) {
    console.warn("Invalid variant used for custom daily run seed boss:", bossConfig.variant);
    bossConfig.variant = undefined;
  }

  return bossConfig;
}

/**
 * Expects the seed to contain the `biome` property.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The biome to use or `null` if no valid match.
 */
export function getDailyEventSeedBiome(seed: string): BiomeId | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const startingBiome = parseDailySeed(seed)?.biome;

  if (startingBiome == null) {
    return null;
  }

  if (!getEnumValues(BiomeId).includes(startingBiome)) {
    console.warn("Invalid biome ID used for custom daily run seed:", startingBiome);
    return null;
  }

  return startingBiome;
}

/**
 * Expects the seed to contain the `luck` property.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The custom luck value or `null` if there is no luck property.
 */
export function getDailyEventSeedLuck(seed: string): number | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const luck = parseDailySeed(seed)?.luck;

  if (luck == null) {
    return null;
  }

  if (luck < 0 || luck > 14) {
    console.warn("Invalid luck value used for custom daily run seed:", luck);
    return null;
  }

  return luck;
}

/**
 * Expects the seed to contain the `money` property.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The custom money value or `null` if there is no money property.
 */
export function getDailyStartingMoney(seed: string): number | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const startingMoney = parseDailySeed(seed)?.money;

  if (startingMoney == null) {
    return null;
  }

  if (startingMoney < 0) {
    console.warn("Invalid starting money value used for custom daily run seed:", startingMoney);
    return null;
  }

  return startingMoney;
}

/**
 * Attempt to parse the seed as a custom daily run seed.
 * @returns The parsed {@linkcode CustomDailyRunConfig}, or `null` if it can't be parsed into json.
 */
function parseDailySeed(seed: string): CustomDailyRunConfig | null {
  try {
    const config = JSON.parse(seed) as CustomDailyRunConfig;
    console.log(config);
    return config;
  } catch {
    return null;
  }
}
