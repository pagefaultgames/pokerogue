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
      SpeciesId.PIKACHU,
      SpeciesId.VOLTORB,
      SpeciesId.ELECTRIKE,
      SpeciesId.SHINX,
      SpeciesId.DEDENNE,
      SpeciesId.GRUBBIN,
      SpeciesId.PAWMI,
      SpeciesId.TADBULB,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.MAGNEMITE,
      SpeciesId.ELECTABUZZ,
      SpeciesId.PLUSLE,
      SpeciesId.MINUN,
      SpeciesId.PACHIRISU,
      SpeciesId.EMOLGA,
      SpeciesId.TOGEDEMARU,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.MAREEP, SpeciesId.ROTOM],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.JOLTEON, SpeciesId.HISUI_VOLTORB],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.ZAPDOS,
      SpeciesId.THUNDURUS,
      SpeciesId.XURKITREE,
      SpeciesId.ZERAORA,
      SpeciesId.REGIELEKI,
    ],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.RAICHU,
      SpeciesId.MANECTRIC,
      SpeciesId.LUXRAY,
      SpeciesId.MAGNEZONE,
      SpeciesId.ELECTIVIRE,
      SpeciesId.DEDENNE,
      SpeciesId.VIKAVOLT,
      SpeciesId.TOGEDEMARU,
      SpeciesId.PAWMOT,
      SpeciesId.BELLIBOLT,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.JOLTEON, SpeciesId.AMPHAROS, SpeciesId.HISUI_ELECTRODE],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.ZAPDOS,
      SpeciesId.THUNDURUS,
      SpeciesId.XURKITREE,
      SpeciesId.ZERAORA,
      SpeciesId.REGIELEKI,
    ],
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
  [BiomePoolTier.COMMON]: [TrainerType.GUITARIST, TrainerType.WORKER],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.VOLKNER, TrainerType.ELESA, TrainerType.CLEMONT],
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

const biomeLinks: BiomeLinks = [BiomeId.FACTORY];

export const powerPlantBiome = new Biome(
  BiomeId.POWER_PLANT,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  9.447,
  biomeLinks,
);
