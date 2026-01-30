import { globalScene } from "#app/global-scene";
import { dailyBiomeWeights } from "#balance/daily-biome-weights";
import { pokemonStarters } from "#balance/pokemon-evolutions";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import { EvoLevelThresholdKind } from "#enums/evo-level-threshold-kind";
import { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { DailySeedBoss } from "#types/daily-run";
import type { Starter, StarterMoveset } from "#types/save-data";
import type { TupleRange } from "#types/type-helpers";
import { isBetween, randSeedGauss, randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import {
  getDailyRunStarter,
  isDailyEventSeed,
  validateDailyBossConfig,
  validateDailyStarterConfig,
} from "./daily-seed-utils";

type StarterTuple = TupleRange<1, 6, Starter>;

/**
 * Generate the daily run starters.
 * @returns A tuple of 3 {@linkcode Starter}s
 */
export function getDailyRunStarters(): StarterTuple {
  const starters: Starter[] = [];
  const seed = globalScene.seed;
  globalScene.executeWithSeedOffset(
    () => {
      const eventStarters = getDailyEventSeedStarters();
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
          .filter(
            s =>
              speciesStarterCosts[s] === cost
              && !starters.some(st => s === st.speciesId || pokemonStarters[st.speciesId] === s),
          );
        const randPkmSpecies = getPokemonSpecies(randSeedItem(costSpecies));
        const starterSpecies = getPokemonSpecies(
          randPkmSpecies.getTrainerSpeciesForLevel(
            startingLevel,
            true,
            PartyMemberStrength.STRONGER,
            EvoLevelThresholdKind.STRONG,
          ),
        );
        starters.push(getDailyRunStarter(starterSpecies));
      }
    },
    0,
    seed,
  );

  setDailyRunEventStarterMovesets(starters as StarterTuple);

  return starters as StarterTuple;
}

/**
 * Get daily run starting biome.
 * @returns The {@linkcode BiomeId}
 */
export function getDailyStartingBiome(): BiomeId {
  const eventBiome = getDailyEventSeedBiome();
  if (eventBiome != null) {
    return eventBiome;
  }

  // TODO: make an actual weighted average utility function
  const biomes = getEnumValues(BiomeId);
  let totalWeight = 0;
  const biomeThresholds: number[] = [];
  for (const biome of getEnumValues(BiomeId)) {
    const weight = dailyBiomeWeights[biome];
    if (weight === 0) {
      continue;
    }

    // Keep track of the total weight & each biome's cumulative weight
    totalWeight += weight;
    biomeThresholds.push(totalWeight);
  }

  const randInt = randSeedInt(totalWeight);

  for (let i = 0; i < biomes.length; i++) {
    if (randInt < biomeThresholds[i]) {
      return biomes[i];
    }
  }

  return randSeedItem(biomes);
}

/**
 * Perform moveset post-processing on Daily run starters.
 * @remarks
 * If the {@linkcode CustomDailyRunConfig} has the `starters` property with a `moveset` property,
 * the movesets will be overwritten.
 * @param starters - The previously generated starters; will have movesets mutated in place
 */
function setDailyRunEventStarterMovesets(starters: StarterTuple): void {
  const movesets = globalScene.gameMode.dailyConfig?.starters?.map(s => s.moveset);
  if (movesets == null) {
    return;
  }

  if (!isBetween(movesets.length, 1, 3)) {
    console.error(
      `Invalid number of custom daily run starter movesets specified (${movesets.length})!\nMovesets: ${movesets}`,
    );
    return;
  }

  const moveIds = getEnumValues(MoveId);
  for (const [index, moveset] of movesets.entries()) {
    if (moveset == null) {
      continue;
    }

    if (moveset.some(f => !moveIds.includes(f))) {
      console.error(
        `Custom daily run starter #${index}'s moveset had one or more invalid Move IDs!`
          + `\nStarter moveset: ${moveset}`,
      );
      return;
    }

    if (!isBetween(moveset.length, 0, 4)) {
      console.error(
        `Custom daily run starter #${index}'s moveset had incorrect length (${moveset.length})!`
          + `\nStarter Moveset: ${moveset.map(m => MoveId[m]).join(", ")}`,
      );
      return;
    }

    const starter = starters[index];
    starter.moveset = moveset as StarterMoveset;
  }
}

/**
 * Parse a custom daily run seed into a set of pre-defined starters.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns An array of {@linkcode Starter}s, or `null` if the config is invalid.
 */
function getDailyEventSeedStarters(): StarterTuple | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  const speciesConfigurations = globalScene.gameMode.dailyConfig?.starters;

  if (speciesConfigurations == null) {
    return null;
  }

  const starters: Starter[] = [];

  for (const speciesConfig of speciesConfigurations) {
    const starterConfig = validateDailyStarterConfig(speciesConfig);
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
 * Sets a custom boss for the daily run if specified in the config.
 * @returns The {@linkcode DailySeedBoss} to use, or `null` if there is no boss config or the {@linkcode SpeciesId} is invalid.
 * @see {@linkcode CustomDailyRunConfig}
 */
export function getDailyEventSeedBoss(): DailySeedBoss | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  const { dailyConfig } = globalScene.gameMode;
  if (!dailyConfig?.boss) {
    return null;
  }

  const bossConfig = validateDailyBossConfig(dailyConfig.boss);
  return bossConfig;
}

/**
 * Get the species for a forced wave for custom daily run.
 * @param waveIndex - The wave index to check
 * @returns The {@linkcode PokemonSpecies} to use, or `null` if there is no forced wave for the given index.
 */
export function getDailyForcedWaveSpecies(waveIndex: number): PokemonSpecies | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  // Only override the first enemy if it's a double battle
  if (globalScene.getEnemyParty().length > 0) {
    return null;
  }

  const forcedWave = globalScene.gameMode.dailyConfig?.forcedWaves?.find(w => w.waveIndex === waveIndex);
  if (forcedWave == null) {
    return null;
  }

  if (forcedWave.speciesId == null) {
    return null;
  }

  return getPokemonSpecies(forcedWave.speciesId);
}

export function getDailyForcedWaveBiomePoolTier(waveIndex: number): BiomePoolTier | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  // Only override the first enemy if it's a double battle
  if (globalScene.getEnemyParty().length > 0) {
    return null;
  }

  const forcedWave = globalScene.gameMode.dailyConfig?.forcedWaves?.find(w => w.waveIndex === waveIndex);
  if (forcedWave == null) {
    return null;
  }

  if (forcedWave.tier == null) {
    return null;
  }

  return forcedWave.tier;
}

export function isDailyForcedWaveHiddenAbility(): boolean {
  if (!isDailyEventSeed()) {
    return false;
  }

  // Only override the first enemy if it's a double battle
  if (globalScene.getEnemyParty().length > 0) {
    return false;
  }

  const forcedWave = globalScene.gameMode.dailyConfig?.forcedWaves?.find(
    w => w.waveIndex === globalScene.currentBattle.waveIndex,
  );
  if (forcedWave == null) {
    return false;
  }

  return forcedWave.hiddenAbility ?? false;
}

/**
 * Sets a custom starting biome for the daily run if specified in the config.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The biome to use or `null` if no valid match.
 */
export function getDailyEventSeedBiome(): BiomeId | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  const startingBiome = globalScene.gameMode.dailyConfig?.biome;

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
 * Sets a custom luck value for the daily run if specified in the config.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The custom luck value or `null` if there is no luck property.
 */
export function getDailyEventSeedLuck(): number | null {
  if (!isDailyEventSeed()) {
    return null;
  }

  const luck = globalScene.gameMode.dailyConfig?.luck;

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
 * Sets a custom starting money value for the daily run if specified in the config.
 * @see {@linkcode CustomDailyRunConfig}
 * @returns The custom money value, or `undefined` if there is no money property.
 */
export function getDailyStartingMoney(): number | undefined {
  if (!isDailyEventSeed()) {
    return;
  }

  const { startingMoney } = globalScene.gameMode.dailyConfig ?? {};
  if (startingMoney == null) {
    return;
  }

  if (startingMoney < 0 || !Number.isSafeInteger(startingMoney)) {
    console.warn("Invalid starting money value used for custom daily run seed!\nMoney: ", startingMoney);
    return;
  }

  return startingMoney;
}
