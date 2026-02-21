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
    [TimeOfDay.DAWN]: [SpeciesId.BAGON, SpeciesId.GOOMY, SpeciesId.JANGMO_O],
    [TimeOfDay.DAY]: [
      SpeciesId.BAGON,
      SpeciesId.GOODRA, // specifically goodra so not hisui
      SpeciesId.JANGMO_O,
    ],
    [TimeOfDay.DUSK]: [SpeciesId.LARVITAR],
    [TimeOfDay.NIGHT]: [SpeciesId.LARVITAR],
    [TimeOfDay.ALL]: [SpeciesId.VIBRAVA, SpeciesId.GIBLE, SpeciesId.AXEW],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [SpeciesId.DEINO],
    [TimeOfDay.NIGHT]: [SpeciesId.DEINO],
    [TimeOfDay.ALL]: [SpeciesId.SWABLU, SpeciesId.DRAMPA, SpeciesId.CYCLIZAR],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [SpeciesId.DREEPY],
    [TimeOfDay.NIGHT]: [SpeciesId.DREEPY],
    [TimeOfDay.ALL]: [SpeciesId.DRATINI, SpeciesId.FRIGIBAX],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.AERODACTYL,
      SpeciesId.DRUDDIGON,
      SpeciesId.TYRUNT,
      SpeciesId.DRACOZOLT,
      SpeciesId.DRACOVISH,
    ],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.REGIDRAGO],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O],
    [TimeOfDay.DAY]: [SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O],
    [TimeOfDay.DUSK]: [SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT],
    [TimeOfDay.NIGHT]: [SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT],
    [TimeOfDay.ALL]: [
      SpeciesId.DRAGONITE,
      SpeciesId.FLYGON,
      SpeciesId.GARCHOMP,
      SpeciesId.HAXORUS,
      SpeciesId.DRAMPA,
      SpeciesId.BAXCALIBUR,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.AERODACTYL,
      SpeciesId.DRUDDIGON,
      SpeciesId.TYRANTRUM,
      SpeciesId.DRACOZOLT,
      SpeciesId.DRACOVISH,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.REGIDRAGO],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.DIALGA],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.DRAGON_TAMER, TrainerType.VETERAN],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.CLAIR, TrainerType.DRAYDEN, TrainerType.RAIHAN],
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

const biomeLinks: BiomeLinks = [BiomeId.BADLANDS];

export const wastelandBiome = new Biome(
  BiomeId.WASTELAND,
  pokemonPool,
  trainerPool,
  12,
  weatherPool,
  terrainPool,
  6.024,
  biomeLinks,
);
