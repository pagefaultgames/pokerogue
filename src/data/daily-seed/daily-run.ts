import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { DailySeedBoss } from "#types/daily-run";
import type { Starter, StarterMoveset } from "#types/save-data";
import { isBetween, randSeedGauss, randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { chunkString } from "#utils/strings";
import { dailyBiomeWeights } from "./daily-biome-weights";
import { getDailyRunStarter, isDailyEventSeed, parseDailySeed, validateDailyPokemonConfig } from "./daily-seed-utils";

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
        starters.push(getDailyRunStarter(starterSpecies));
      }
    },
    0,
    seed,
  );

  setDailyRunEventStarterMovesets(seed, starters as StarterTuple);

  return starters as StarterTuple;
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

/**
 * Parse a custom daily run seed into a set of pre-defined starters.
 * @see {@linkcode CustomDailyRunConfig}
 * @param seed - The daily run seed
 * @returns An array of {@linkcode Starter}s, or `null` if the config is invalid.
 */
function getDailyEventSeedStarters(seed: string): StarterTuple | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const speciesConfigurations = parseDailySeed(seed)?.starters;

  if (speciesConfigurations == null || speciesConfigurations.length !== 3) {
    console.error("Invalid starters used for custom daily run seed!", seed);
    return null;
  }

  const starters: Starter[] = [];

  for (const speciesConfig of speciesConfigurations) {
    const starterConfig = validateDailyPokemonConfig(speciesConfig);
    if (!starterConfig) {
      return null;
    }

    const species = getPokemonSpecies(starterConfig.speciesId);

    const starter = getDailyRunStarter(species, starterConfig);

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

  const bossConfig = validateDailyPokemonConfig(parseDailySeed(seed)?.boss);
  if (!bossConfig) {
    return null;
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
