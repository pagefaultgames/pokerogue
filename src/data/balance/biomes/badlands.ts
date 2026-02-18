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
    [TimeOfDay.DAWN]: [SpeciesId.PHANPY],
    [TimeOfDay.DAY]: [SpeciesId.PHANPY],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.CUBONE],
    [TimeOfDay.ALL]: [SpeciesId.DIGLETT, SpeciesId.GEODUDE, SpeciesId.RHYHORN, SpeciesId.DRILBUR, SpeciesId.MUDBRAY],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.SIZZLIPEDE, SpeciesId.CAPSAKID],
    [TimeOfDay.DAY]: [SpeciesId.SIZZLIPEDE, SpeciesId.CAPSAKID],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SANDSHREW, SpeciesId.NUMEL, SpeciesId.ROGGENROLA, SpeciesId.CUFANT],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ONIX, SpeciesId.GLIGAR, SpeciesId.KLAWF, SpeciesId.POLTCHAGEIST],
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
    [TimeOfDay.ALL]: [SpeciesId.LANDORUS, SpeciesId.OKIDOGI],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN],
    [TimeOfDay.DAY]: [SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.MAROWAK],
    [TimeOfDay.ALL]: [
      SpeciesId.DUGTRIO,
      SpeciesId.GOLEM,
      SpeciesId.RHYPERIOR,
      SpeciesId.GLISCOR,
      SpeciesId.EXCADRILL,
      SpeciesId.MUDSDALE,
      SpeciesId.COPPERAJAH,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.STEELIX, SpeciesId.SINISTCHA],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.LANDORUS, SpeciesId.OKIDOGI],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.GROUDON],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.BACKPACKER, TrainerType.HIKER],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER, TrainerType.DRAGON_TAMER],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.CLAY, TrainerType.GRANT],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 8,
  [WeatherType.SANDSTORM]: 2,
  [WeatherType.SUNNY]: 5,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.DESERT, BiomeId.MOUNTAIN];

export const badlandsBiome = new Biome(
  BiomeId.BADLANDS,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  17.79,
  biomeLinks,
);
