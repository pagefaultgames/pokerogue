import { Biome } from "#data/biome";
import { TerrainType } from "#data/terrain";
import { BiomeId } from "#enums/biome-id";
import { BiomePoolTier } from "#enums/biome-pool-tier";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import { WeatherType } from "#enums/weather-type";
import type { BiomeLinks, BiomePokemonPools, TerrainPool, TrainerPools, WeatherPool } from "#types/biomes";

const pokemonPool: BiomePokemonPools = {
  [BiomePoolTier.COMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.YAMPER],
    [TimeOfDay.DAY]: [SpeciesId.YAMPER],
    [TimeOfDay.DUSK]: [SpeciesId.HOUNDOUR],
    [TimeOfDay.NIGHT]: [SpeciesId.HOUNDOUR],
    [TimeOfDay.ALL]: [SpeciesId.RATTATA, SpeciesId.ZIGZAGOON, SpeciesId.PATRAT, SpeciesId.LILLIPUP],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.INDEEDEE],
    [TimeOfDay.DAY]: [SpeciesId.INDEEDEE],
    [TimeOfDay.DUSK]: [SpeciesId.ESPURR],
    [TimeOfDay.NIGHT]: [SpeciesId.ESPURR],
    [TimeOfDay.ALL]: [
      SpeciesId.PIKACHU,
      SpeciesId.GLAMEOW,
      SpeciesId.FURFROU,
      SpeciesId.FIDOUGH,
      SpeciesId.SQUAWKABILLY,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.TANDEMAUS],
    [TimeOfDay.DAY]: [SpeciesId.TANDEMAUS],
    [TimeOfDay.DUSK]: [SpeciesId.MORPEKO],
    [TimeOfDay.NIGHT]: [SpeciesId.MORPEKO],
    [TimeOfDay.ALL]: [SpeciesId.SMEARGLE, SpeciesId.CASTFORM, SpeciesId.VAROOM],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.DITTO, SpeciesId.EEVEE],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.BOLTUND],
    [TimeOfDay.DAY]: [SpeciesId.BOLTUND],
    [TimeOfDay.DUSK]: [SpeciesId.MEOWSTIC],
    [TimeOfDay.NIGHT]: [SpeciesId.MEOWSTIC],
    [TimeOfDay.ALL]: [SpeciesId.CASTFORM, SpeciesId.STOUTLAND, SpeciesId.FURFROU, SpeciesId.DACHSBUN],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.MAUSHOLD],
    [TimeOfDay.DAY]: [SpeciesId.MAUSHOLD],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.REVAVROOM],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [
    TrainerType.BEAUTY,
    TrainerType.CLERK,
    TrainerType.CYCLIST,
    TrainerType.OFFICER,
    TrainerType.WAITER,
  ],
  [BiomePoolTier.UNCOMMON]: [TrainerType.BREEDER, TrainerType.DEPOT_AGENT, TrainerType.GUITARIST],
  [BiomePoolTier.RARE]: [TrainerType.ARTIST, TrainerType.RICH_KID],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.WHITNEY, TrainerType.NORMAN, TrainerType.IONO, TrainerType.LARRY],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.SLUM];

export const metropolisBiome = new Biome(
  BiomeId.METROPOLIS,
  pokemonPool,
  trainerPool,
  4,
  weatherPool,
  terrainPool,
  141.47,
  biomeLinks,
);
