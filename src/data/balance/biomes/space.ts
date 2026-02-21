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
    [TimeOfDay.DAWN]: [SpeciesId.SOLROCK],
    [TimeOfDay.DAY]: [SpeciesId.SOLROCK],
    [TimeOfDay.DUSK]: [SpeciesId.LUNATONE],
    [TimeOfDay.NIGHT]: [SpeciesId.LUNATONE],
    [TimeOfDay.ALL]: [SpeciesId.CLEFFA, SpeciesId.BRONZOR, SpeciesId.MUNNA, SpeciesId.MINIOR],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.BALTOY, SpeciesId.ELGYEM],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.STARYU, SpeciesId.SIGILYPH, SpeciesId.SOLOSIS],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.PORYGON, SpeciesId.BELDUM],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.COSMOG, SpeciesId.CELESTEELA],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [SpeciesId.SOLROCK],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.LUNATONE],
    [TimeOfDay.ALL]: [
      SpeciesId.CLEFABLE,
      SpeciesId.BRONZONG,
      SpeciesId.MUSHARNA,
      SpeciesId.REUNICLUS,
      SpeciesId.MINIOR,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.METAGROSS, SpeciesId.PORYGON_Z],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.CELESTEELA],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [SpeciesId.SOLGALEO],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.LUNALA],
    [TimeOfDay.ALL]: [SpeciesId.RAYQUAZA, SpeciesId.NECROZMA],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.OLYMPIA],
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

const biomeLinks: BiomeLinks = [BiomeId.RUINS];

export const spaceBiome = new Biome(
  BiomeId.SPACE,
  pokemonPool,
  trainerPool,
  16,
  weatherPool,
  terrainPool,
  20.036,
  biomeLinks,
);
