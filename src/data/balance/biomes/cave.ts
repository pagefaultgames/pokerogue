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
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.ZUBAT,
      SpeciesId.PARAS,
      SpeciesId.TEDDIURSA,
      SpeciesId.WHISMUR,
      SpeciesId.ROGGENROLA,
      SpeciesId.WOOBAT,
      SpeciesId.BUNNELBY,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [SpeciesId.ROCKRUFF],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.GEODUDE, SpeciesId.MAKUHITA, SpeciesId.NOSEPASS, SpeciesId.NOIBAT, SpeciesId.WIMPOD],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ONIX, SpeciesId.FERROSEED, SpeciesId.CARBINK, SpeciesId.NACLI, SpeciesId.GLIMMET],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SHUCKLE],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.UXIE],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.PARASECT,
      SpeciesId.ONIX,
      SpeciesId.CROBAT,
      SpeciesId.URSARING,
      SpeciesId.EXPLOUD,
      SpeciesId.PROBOPASS,
      SpeciesId.GIGALITH,
      SpeciesId.SWOOBAT,
      SpeciesId.DIGGERSBY,
      SpeciesId.NOIVERN,
      SpeciesId.GOLISOPOD,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [SpeciesId.LYCANROC],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SHUCKLE, SpeciesId.FERROTHORN, SpeciesId.GARGANACL, SpeciesId.GLIMMORA],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.UXIE],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TERAPAGOS],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.BACKPACKER, TrainerType.HIKER],
  [BiomePoolTier.UNCOMMON]: [
    TrainerType.ACE_TRAINER,
    TrainerType.BLACK_BELT,
    TrainerType.COLLECTOR,
    TrainerType.RUIN_MANIAC,
  ],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.BROCK, TrainerType.ROXANNE, TrainerType.ROARK],
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

const biomeLinks: BiomeLinks = [BiomeId.BADLANDS, BiomeId.LAKE, [BiomeId.LABORATORY, 2]];

export const caveBiome = new Biome(
  BiomeId.CAVE,
  pokemonPool,
  trainerPool,
  6,
  weatherPool,
  terrainPool,
  14.24,
  biomeLinks,
);
