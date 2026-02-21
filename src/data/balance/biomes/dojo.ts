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
    [TimeOfDay.ALL]: [SpeciesId.MANKEY, SpeciesId.MAKUHITA, SpeciesId.MEDITITE, SpeciesId.STUFFUL, SpeciesId.CLOBBOPUS],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.CROAGUNK, SpeciesId.SCRAGGY, SpeciesId.MIENFOO],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.HITMONLEE,
      SpeciesId.HITMONCHAN,
      SpeciesId.LUCARIO,
      SpeciesId.THROH,
      SpeciesId.SAWK,
      SpeciesId.PANCHAM,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.GALAR_FARFETCHD],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TERRAKION, SpeciesId.KUBFU, SpeciesId.GALAR_ZAPDOS],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.HITMONLEE,
      SpeciesId.HITMONCHAN,
      SpeciesId.HARIYAMA,
      SpeciesId.MEDICHAM,
      SpeciesId.LUCARIO,
      SpeciesId.TOXICROAK,
      SpeciesId.THROH,
      SpeciesId.SAWK,
      SpeciesId.SCRAFTY,
      SpeciesId.MIENSHAO,
      SpeciesId.BEWEAR,
      SpeciesId.GRAPPLOCT,
      SpeciesId.ANNIHILAPE,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.HITMONTOP,
      SpeciesId.GALLADE,
      SpeciesId.PANGORO,
      SpeciesId.SIRFETCHD,
      SpeciesId.HISUI_DECIDUEYE,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TERRAKION, SpeciesId.KUBFU, SpeciesId.GALAR_ZAPDOS],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.ZAMAZENTA],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.BLACK_BELT],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.BRAWLY, TrainerType.MAYLENE, TrainerType.KORRINA, TrainerType.BEA],
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

const biomeLinks: BiomeLinks = [BiomeId.PLAINS, [BiomeId.JUNGLE, 2], [BiomeId.TEMPLE, 2]];

export const dojoBiome = new Biome(
  BiomeId.DOJO,
  pokemonPool,
  trainerPool,
  4,
  weatherPool,
  terrainPool,
  6.205,
  biomeLinks,
);
