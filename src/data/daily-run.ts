import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import { PokemonSpecies } from "#data/pokemon-species";
import { BiomeId } from "#enums/biome-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { SpeciesId } from "#enums/species-id";
import type { Starter } from "#ui/handlers/starter-select-ui-handler";
import { isNullOrUndefined, randSeedGauss, randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";

export interface DailyRunConfig {
  seed: number;
  starters: Starter;
}

export function fetchDailyRunSeed(): Promise<string | null> {
  return new Promise<string | null>((resolve, _reject) => {
    pokerogueApi.daily.getSeed().then(dailySeed => {
      resolve(dailySeed);
    });
  });
}

export function getDailyRunStarters(seed: string): Starter[] {
  const starters: Starter[] = [];

  globalScene.executeWithSeedOffset(
    () => {
      const startingLevel = globalScene.gameMode.getStartingLevel();

      const eventStarters = getDailyEventSeedStarters(seed);
      if (!isNullOrUndefined(eventStarters)) {
        starters.push(...eventStarters);
        return;
      }

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

  return starters;
}

function getDailyRunStarter(starterSpeciesForm: PokemonSpeciesForm, startingLevel: number): Starter {
  const starterSpecies =
    starterSpeciesForm instanceof PokemonSpecies ? starterSpeciesForm : getPokemonSpecies(starterSpeciesForm.speciesId);
  const formIndex = starterSpeciesForm instanceof PokemonSpecies ? undefined : starterSpeciesForm.formIndex;
  const pokemon = globalScene.addPlayerPokemon(starterSpecies, startingLevel, undefined, formIndex);
  const starter: Starter = {
    species: starterSpecies,
    dexAttr: pokemon.getDexAttr(),
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
  if (!isNullOrUndefined(eventBiome)) {
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
 * Expects the seed to contain `/starters\d{18}/`
 * where the digits alternate between 4 digits for the species ID and 2 digits for the form index
 * (left padded with `0`s as necessary).
 * @returns An array of {@linkcode Starter}s, or `null` if no valid match.
 */
export function getDailyEventSeedStarters(seed: string): Starter[] | null {
  if (!isDailyEventSeed(seed)) {
    return null;
  }

  const starters: Starter[] = [];
  const match = /starters(\d{4})(\d{2})(\d{4})(\d{2})(\d{4})(\d{2})/g.exec(seed);

  if (!match || match.length !== 7) {
    return null;
  }

  for (let i = 1; i < match.length; i += 2) {
    const speciesId = Number.parseInt(match[i]) as SpeciesId;
    const formIndex = Number.parseInt(match[i + 1]);

    if (!getEnumValues(SpeciesId).includes(speciesId)) {
      console.warn("Invalid species ID used for custom daily run seed starter:", speciesId);
      return null;
    }

    const starterForm = getPokemonSpeciesForm(speciesId, formIndex);
    const startingLevel = globalScene.gameMode.getStartingLevel();
    const starter = getDailyRunStarter(starterForm, startingLevel);
    starters.push(starter);
  }

  return starters;
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
