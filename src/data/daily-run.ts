import { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import { globalScene } from "#app/global-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import type { Starter } from "#app/ui/starter-select-ui-handler";
import { randSeedGauss, randSeedInt, randSeedItem, getEnumValues } from "#app/utils/common";
import type { PokemonSpeciesForm } from "#app/data/pokemon-species";
import PokemonSpecies, { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { BiomeId } from "#enums/biome-id";

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

      if (/\d{18}$/.test(seed)) {
        for (let s = 0; s < 3; s++) {
          const offset = 6 + s * 6;
          const starterSpeciesForm = getPokemonSpeciesForm(
            Number.parseInt(seed.slice(offset, offset + 4)) as SpeciesId,
            Number.parseInt(seed.slice(offset + 4, offset + 6)),
          );
          starters.push(getDailyRunStarter(starterSpeciesForm, startingLevel));
        }
        return;
      }

      const starterCosts: number[] = [];
      starterCosts.push(Math.min(Math.round(3.5 + Math.abs(randSeedGauss(1))), 8));
      starterCosts.push(randSeedInt(9 - starterCosts[0], 1));
      starterCosts.push(10 - (starterCosts[0] + starterCosts[1]));

      for (let c = 0; c < starterCosts.length; c++) {
        const cost = starterCosts[c];
        const costSpecies = Object.keys(speciesStarterCosts)
          .map(s => Number.parseInt(s) as SpeciesId)
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
  const pokemon = new PlayerPokemon(
    starterSpecies,
    startingLevel,
    undefined,
    formIndex,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
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
  return biomes[randSeedInt(biomes.length)];
}
