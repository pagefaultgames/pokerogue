import { PartyMemberStrength } from "#enums/party-member-strength";
import type { Species } from "#enums/species";
import { globalScene } from "#app/global-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import type { Starter } from "#app/ui/starter-select-ui-handler";
import { randSeedGauss, randSeedInt, randSeedItem, getEnumValues } from "#app/utils/common";
import type { PokemonSpeciesForm } from "#app/data/pokemon-species";
import PokemonSpecies, { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { Biome } from "#app/enums/biome";

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
            Number.parseInt(seed.slice(offset, offset + 4)) as Species,
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
          .map(s => Number.parseInt(s) as Species)
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
  [Biome.CAVE]: 3,
  [Biome.LAKE]: 3,
  [Biome.PLAINS]: 3,
  [Biome.SNOWY_FOREST]: 3,
  [Biome.SWAMP]: 3, // 2 -> 3
  [Biome.TALL_GRASS]: 3, // 2 -> 3

  [Biome.ABYSS]: 2, // 3 -> 2
  [Biome.RUINS]: 2,
  [Biome.BADLANDS]: 2,
  [Biome.BEACH]: 2,
  [Biome.CONSTRUCTION_SITE]: 2,
  [Biome.DESERT]: 2,
  [Biome.DOJO]: 2, // 3 -> 2
  [Biome.FACTORY]: 2,
  [Biome.FAIRY_CAVE]: 2,
  [Biome.FOREST]: 2,
  [Biome.GRASS]: 2, // 1 -> 2
  [Biome.MEADOW]: 2,
  [Biome.MOUNTAIN]: 2, // 3 -> 2
  [Biome.SEA]: 2,
  [Biome.SEABED]: 2,
  [Biome.SLUM]: 2,
  [Biome.TEMPLE]: 2, // 3 -> 2
  [Biome.VOLCANO]: 2,

  [Biome.GRAVEYARD]: 1,
  [Biome.ICE_CAVE]: 1,
  [Biome.ISLAND]: 1,
  [Biome.JUNGLE]: 1,
  [Biome.LABORATORY]: 1,
  [Biome.METROPOLIS]: 1,
  [Biome.POWER_PLANT]: 1,
  [Biome.SPACE]: 1,
  [Biome.WASTELAND]: 1,

  [Biome.TOWN]: 0,
  [Biome.END]: 0,
};

export function getDailyStartingBiome(): Biome {
  const biomes = getEnumValues(Biome).filter(b => b !== Biome.TOWN && b !== Biome.END);

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
