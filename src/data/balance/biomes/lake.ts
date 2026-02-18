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
    [TimeOfDay.DAWN]: [SpeciesId.LOTAD, SpeciesId.DUCKLETT],
    [TimeOfDay.DAY]: [SpeciesId.LOTAD, SpeciesId.DUCKLETT],
    [TimeOfDay.DUSK]: [SpeciesId.MARILL],
    [TimeOfDay.NIGHT]: [SpeciesId.MARILL],
    [TimeOfDay.ALL]: [SpeciesId.PSYDUCK, SpeciesId.GOLDEEN, SpeciesId.WOOPER, SpeciesId.SURSKIT, SpeciesId.CHEWTLE],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.DEWPIDER],
    [TimeOfDay.DAY]: [SpeciesId.DEWPIDER],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SLOWPOKE, SpeciesId.MAGIKARP, SpeciesId.WISHIWASHI],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SQUIRTLE, SpeciesId.OSHAWOTT, SpeciesId.FROAKIE, SpeciesId.SOBBLE, SpeciesId.FLAMIGO],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.VAPOREON, SpeciesId.SLOWKING],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SUICUNE, SpeciesId.MESPRIT],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.SWANNA, SpeciesId.ARAQUANID],
    [TimeOfDay.DAY]: [SpeciesId.SWANNA, SpeciesId.ARAQUANID],
    [TimeOfDay.DUSK]: [SpeciesId.AZUMARILL],
    [TimeOfDay.NIGHT]: [SpeciesId.AZUMARILL],
    [TimeOfDay.ALL]: [
      SpeciesId.GOLDUCK,
      SpeciesId.SLOWBRO,
      SpeciesId.SEAKING,
      SpeciesId.MASQUERAIN,
      SpeciesId.WISHIWASHI,
      SpeciesId.DREDNAW,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.BLASTOISE,
      SpeciesId.GYARADOS,
      SpeciesId.VAPOREON,
      SpeciesId.SLOWKING,
      SpeciesId.SAMUROTT,
      SpeciesId.GRENINJA,
      SpeciesId.INTELEON,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SUICUNE, SpeciesId.MESPRIT],
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
  [BiomePoolTier.COMMON]: [TrainerType.BREEDER, TrainerType.FISHERMAN, TrainerType.PARASOL_LADY],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER, TrainerType.YOUNG_COUPLE],
  [BiomePoolTier.RARE]: [TrainerType.BLACK_BELT],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.CRASHER_WAKE],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 10,
  [WeatherType.RAIN]: 4,
  [WeatherType.FOG]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.BEACH, BiomeId.SWAMP, BiomeId.CONSTRUCTION_SITE];

export const lakeBiome = new Biome(
  BiomeId.LAKE,
  pokemonPool,
  trainerPool,
  6,
  weatherPool,
  terrainPool,
  7.215,
  biomeLinks,
);
