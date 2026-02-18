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
    [TimeOfDay.DUSK]: [SpeciesId.ALOLA_RATTATA, SpeciesId.ALOLA_MEOWTH],
    [TimeOfDay.NIGHT]: [SpeciesId.ALOLA_RATTATA, SpeciesId.ALOLA_MEOWTH],
    [TimeOfDay.ALL]: [
      SpeciesId.ORICORIO,
      SpeciesId.ALOLA_SANDSHREW,
      SpeciesId.ALOLA_VULPIX,
      SpeciesId.ALOLA_DIGLETT,
      SpeciesId.ALOLA_GEODUDE,
      SpeciesId.ALOLA_GRIMER,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR],
    [TimeOfDay.DAY]: [SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR],
    [TimeOfDay.DUSK]: [SpeciesId.ALOLA_MAROWAK],
    [TimeOfDay.NIGHT]: [SpeciesId.ALOLA_MAROWAK],
    [TimeOfDay.ALL]: [SpeciesId.BRUXISH],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
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
    [TimeOfDay.ALL]: [SpeciesId.BLACEPHALON],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR],
    [TimeOfDay.DAY]: [SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR],
    [TimeOfDay.DUSK]: [SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK],
    [TimeOfDay.NIGHT]: [SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK],
    [TimeOfDay.ALL]: [
      SpeciesId.ORICORIO,
      SpeciesId.BRUXISH,
      SpeciesId.ALOLA_SANDSLASH,
      SpeciesId.ALOLA_NINETALES,
      SpeciesId.ALOLA_DUGTRIO,
      SpeciesId.ALOLA_GOLEM,
      SpeciesId.ALOLA_MUK,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.BLACEPHALON],
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
  [BiomePoolTier.COMMON]: [TrainerType.RICH_KID],
  [BiomePoolTier.UNCOMMON]: [TrainerType.RICH],
  [BiomePoolTier.RARE]: [TrainerType.YOUNG_COUPLE],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.NESSA],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 7,
  [WeatherType.RAIN]: 3,
  [WeatherType.SUNNY]: 5,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.SEA];

export const islandBiome = new Biome(
  BiomeId.ISLAND,
  pokemonPool,
  trainerPool,
  12,
  weatherPool,
  terrainPool,
  2.751,
  biomeLinks,
);
