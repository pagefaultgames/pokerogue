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
    [TimeOfDay.DUSK]: [SpeciesId.SHUPPET],
    [TimeOfDay.NIGHT]: [SpeciesId.SHUPPET],
    [TimeOfDay.ALL]: [
      SpeciesId.RATTATA,
      SpeciesId.GRIMER,
      SpeciesId.DROWZEE,
      SpeciesId.KOFFING,
      SpeciesId.MURKROW,
      SpeciesId.GLAMEOW,
      SpeciesId.SCRAGGY,
      SpeciesId.TRUBBISH,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.HOUNDOUR,
      SpeciesId.WORMADAM,
      SpeciesId.STUNKY,
      SpeciesId.PANCHAM,
      SpeciesId.MASCHIFF,
      SpeciesId.ALOLA_RATTATA,
      SpeciesId.GALAR_ZIGZAGOON,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.SNEASEL,
      SpeciesId.GOTHITA,
      SpeciesId.PAWNIARD,
      SpeciesId.TOXEL,
      SpeciesId.SQUAWKABILLY,
      SpeciesId.VAROOM,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.GUZZLORD],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.MUK,
      SpeciesId.WEEZING,
      SpeciesId.SKUNTANK,
      SpeciesId.SCRAFTY,
      SpeciesId.GARBODOR,
      SpeciesId.PANGORO,
      SpeciesId.ALOLA_RATICATE,
      SpeciesId.OBSTAGOON,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.WEAVILE, SpeciesId.TOXTRICITY, SpeciesId.REVAVROOM, SpeciesId.GALAR_WEEZING],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.GUZZLORD],
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
  [BiomePoolTier.COMMON]: [TrainerType.BIKER, TrainerType.OFFICER, TrainerType.ROUGHNECK],
  [BiomePoolTier.UNCOMMON]: [TrainerType.BAKER, TrainerType.HOOLIGANS],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.PIERS],
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

const biomeLinks: BiomeLinks = [BiomeId.CONSTRUCTION_SITE, [BiomeId.SWAMP, 2]];

export const slumBiome = new Biome(BiomeId.SLUM, pokemonPool, trainerPool, 6, weatherPool, terrainPool, 0, biomeLinks);
