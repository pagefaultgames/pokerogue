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
      SpeciesId.DROWZEE,
      SpeciesId.NATU,
      SpeciesId.UNOWN,
      SpeciesId.SPOINK,
      SpeciesId.BALTOY,
      SpeciesId.ELGYEM,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ABRA, SpeciesId.SIGILYPH, SpeciesId.TINKATINK],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, SpeciesId.GOTHITA, SpeciesId.STONJOURNER],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [SpeciesId.ESPEON],
    [TimeOfDay.DUSK]: [SpeciesId.GALAR_YAMASK],
    [TimeOfDay.NIGHT]: [SpeciesId.GALAR_YAMASK],
    [TimeOfDay.ALL]: [SpeciesId.ARCHEN],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.ALAKAZAM,
      SpeciesId.HYPNO,
      SpeciesId.XATU,
      SpeciesId.GRUMPIG,
      SpeciesId.CLAYDOL,
      SpeciesId.SIGILYPH,
      SpeciesId.GOTHITELLE,
      SpeciesId.BEHEEYEM,
      SpeciesId.TINKATON,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [SpeciesId.ESPEON],
    [TimeOfDay.DUSK]: [SpeciesId.RUNERIGUS],
    [TimeOfDay.NIGHT]: [SpeciesId.RUNERIGUS],
    [TimeOfDay.ALL]: [SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, SpeciesId.ARCHEOPS],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.KORAIDON],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.PSYCHIC, TrainerType.RUIN_MANIAC, TrainerType.SCIENTIST],
  [BiomePoolTier.UNCOMMON]: [
    TrainerType.ACE_TRAINER,
    TrainerType.BLACK_BELT,
    TrainerType.COLLECTOR,
    TrainerType.HEX_MANIAC,
  ],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.SABRINA, TrainerType.TATE, TrainerType.LIZA, TrainerType.TULIP],
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

const biomeLinks: BiomeLinks = [BiomeId.MOUNTAIN, [BiomeId.FOREST, 2]];

export const ruinsBiome = new Biome(
  BiomeId.RUINS,
  pokemonPool,
  trainerPool,
  12,
  weatherPool,
  terrainPool,
  0,
  biomeLinks,
);
