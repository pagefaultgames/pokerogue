import { TerrainType } from "#data/terrain";
import { BiomeId } from "#enums/biome-id";
import { BiomePoolTier } from "#enums/biome-pool-tier";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import { WeatherType } from "#enums/weather-type";
import type { Biome, BiomeLinks, BiomePokemonPools, TerrainPool, TrainerPools, WeatherPool } from "#types/biomes";

const pokemonPool: BiomePokemonPools = {
  [BiomePoolTier.COMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.STARYU],
    [TimeOfDay.DAY]: [SpeciesId.STARYU],
    [TimeOfDay.DUSK]: [SpeciesId.SHELLDER],
    [TimeOfDay.NIGHT]: [SpeciesId.SHELLDER],
    [TimeOfDay.ALL]: [
      SpeciesId.KRABBY,
      SpeciesId.CORPHISH,
      SpeciesId.DWEBBLE,
      SpeciesId.BINACLE,
      SpeciesId.MAREANIE,
      SpeciesId.WIGLETT,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.BURMY, SpeciesId.CLAUNCHER, SpeciesId.SANDYGAST],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.QUAXLY, SpeciesId.TATSUGIRI],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TIRTOUGA],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.THUNDURUS, SpeciesId.KELDEO],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.STARMIE],
    [TimeOfDay.DAY]: [SpeciesId.STARMIE],
    [TimeOfDay.DUSK]: [SpeciesId.CLOYSTER],
    [TimeOfDay.NIGHT]: [SpeciesId.CLOYSTER],
    [TimeOfDay.ALL]: [
      SpeciesId.KINGLER,
      SpeciesId.CRAWDAUNT,
      SpeciesId.WORMADAM,
      SpeciesId.CRUSTLE,
      SpeciesId.BARBARACLE,
      SpeciesId.CLAWITZER,
      SpeciesId.TOXAPEX,
      SpeciesId.PALOSSAND,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.CARRACOSTA, SpeciesId.QUAQUAVAL],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.THUNDURUS, SpeciesId.KELDEO],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ZEKROM],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.SAILOR],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT],
  [BiomePoolTier.RARE]: [TrainerType.VETERAN],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.JASMINE, TrainerType.VOLKNER],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 9,
  [WeatherType.RAIN]: 4,
  [WeatherType.FOG]: 2,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.ROCKY_COAST];

export const rockyCoastBiome: Biome = {
  biomeId: BiomeId.ROCKY_COAST,
  pokemonPool,
  trainerPool,
  trainerChance: 12,
  weatherPool,
  terrainPool,
  biomeLinks,
};
