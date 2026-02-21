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
      SpeciesId.SEEL,
      SpeciesId.SWINUB,
      SpeciesId.SNORUNT,
      SpeciesId.VANILLITE,
      SpeciesId.CUBCHOO,
      SpeciesId.BERGMITE,
      SpeciesId.CRABRAWLER,
      SpeciesId.SNOM,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.SLOWKING,
      SpeciesId.SNEASEL,
      SpeciesId.SMOOCHUM,
      SpeciesId.SPHEAL,
      SpeciesId.EISCUE,
      SpeciesId.CETODDLE,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.LAPRAS, SpeciesId.DELIBIRD, SpeciesId.CRYOGONAL],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.AMAURA],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ARTICUNO, SpeciesId.REGICE],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.DEWGONG,
      SpeciesId.GLALIE,
      SpeciesId.WALREIN,
      SpeciesId.WEAVILE,
      SpeciesId.MAMOSWINE,
      SpeciesId.FROSLASS,
      SpeciesId.VANILLUXE,
      SpeciesId.BEARTIC,
      SpeciesId.CRYOGONAL,
      SpeciesId.AVALUGG,
      SpeciesId.CRABOMINABLE,
      SpeciesId.CETITAN,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.GLACEON, SpeciesId.AURORUS],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ARTICUNO, SpeciesId.REGICE],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.KYUREM],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.SNOW_WORKER],
  [BiomePoolTier.UNCOMMON]: [TrainerType.SNOW_ACE_TRAINER],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.PRYCE, TrainerType.BRYCEN, TrainerType.WULFRIC, TrainerType.GRUSHA],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 3,
  [WeatherType.SNOW]: 4,
  [WeatherType.HAIL]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.SNOWY_FOREST];

export const iceCaveBiome = new Biome(
  BiomeId.ICE_CAVE,
  pokemonPool,
  trainerPool,
  12,
  weatherPool,
  terrainPool,
  0,
  biomeLinks,
);
