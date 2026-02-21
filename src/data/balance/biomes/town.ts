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
    [TimeOfDay.DAWN]: [
      SpeciesId.CATERPIE,
      SpeciesId.SENTRET,
      SpeciesId.LEDYBA,
      SpeciesId.HOPPIP,
      SpeciesId.SUNKERN,
      SpeciesId.SILCOON,
      SpeciesId.STARLY,
      SpeciesId.PIDOVE,
      SpeciesId.COTTONEE,
      SpeciesId.SCATTERBUG,
      SpeciesId.YUNGOOS,
      SpeciesId.SKWOVET,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.CATERPIE,
      SpeciesId.SENTRET,
      SpeciesId.LEDYBA,
      SpeciesId.HOPPIP,
      SpeciesId.SUNKERN,
      SpeciesId.SILCOON,
      SpeciesId.STARLY,
      SpeciesId.PIDOVE,
      SpeciesId.COTTONEE,
      SpeciesId.SCATTERBUG,
      SpeciesId.YUNGOOS,
      SpeciesId.SKWOVET,
    ],
    [TimeOfDay.DUSK]: [
      SpeciesId.WEEDLE,
      SpeciesId.HOOTHOOT,
      SpeciesId.SPINARAK,
      SpeciesId.POOCHYENA,
      SpeciesId.CASCOON,
      SpeciesId.PURRLOIN,
      SpeciesId.BLIPBUG,
    ],
    [TimeOfDay.NIGHT]: [
      SpeciesId.WEEDLE,
      SpeciesId.HOOTHOOT,
      SpeciesId.SPINARAK,
      SpeciesId.POOCHYENA,
      SpeciesId.CASCOON,
      SpeciesId.PURRLOIN,
      SpeciesId.BLIPBUG,
    ],
    [TimeOfDay.ALL]: [
      SpeciesId.PIDGEY,
      SpeciesId.RATTATA,
      SpeciesId.SPEAROW,
      SpeciesId.ZIGZAGOON,
      SpeciesId.WURMPLE,
      SpeciesId.TAILLOW,
      SpeciesId.BIDOOF,
      SpeciesId.PATRAT,
      SpeciesId.LILLIPUP,
      SpeciesId.FLETCHLING,
      SpeciesId.WOOLOO,
      SpeciesId.LECHONK,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.NIDORAN_F,
      SpeciesId.NIDORAN_M,
      SpeciesId.BELLSPROUT,
      SpeciesId.POOCHYENA,
      SpeciesId.LOTAD,
      SpeciesId.SKITTY,
      SpeciesId.COMBEE,
      SpeciesId.CHERUBI,
      SpeciesId.MINCCINO,
      SpeciesId.PAWMI,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.NIDORAN_F,
      SpeciesId.NIDORAN_M,
      SpeciesId.BELLSPROUT,
      SpeciesId.POOCHYENA,
      SpeciesId.LOTAD,
      SpeciesId.SKITTY,
      SpeciesId.COMBEE,
      SpeciesId.CHERUBI,
      SpeciesId.MINCCINO,
      SpeciesId.PAWMI,
    ],
    [TimeOfDay.DUSK]: [
      SpeciesId.EKANS,
      SpeciesId.ODDISH,
      SpeciesId.PARAS,
      SpeciesId.VENONAT,
      SpeciesId.MEOWTH,
      SpeciesId.SHROOMISH,
      SpeciesId.KRICKETOT,
    ],
    [TimeOfDay.NIGHT]: [
      SpeciesId.EKANS,
      SpeciesId.ODDISH,
      SpeciesId.PARAS,
      SpeciesId.VENONAT,
      SpeciesId.MEOWTH,
      SpeciesId.SHROOMISH,
      SpeciesId.KRICKETOT,
    ],
    [TimeOfDay.ALL]: [SpeciesId.SEEDOT, SpeciesId.WHISMUR, SpeciesId.VENIPEDE, SpeciesId.FIDOUGH],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.ABRA,
      SpeciesId.CLEFFA,
      SpeciesId.IGGLYBUFF,
      SpeciesId.SURSKIT,
      SpeciesId.HAPPINY,
      SpeciesId.ROOKIDEE,
      SpeciesId.TANDEMAUS,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.EEVEE,
      SpeciesId.PICHU,
      SpeciesId.TOGEPI,
      SpeciesId.RALTS,
      SpeciesId.NINCADA,
      SpeciesId.RIOLU,
    ],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.DITTO, SpeciesId.MUNCHLAX, SpeciesId.ZORUA],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [],
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
    [TimeOfDay.ALL]: [],
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
  [BiomePoolTier.COMMON]: [TrainerType.YOUNGSTER],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [],
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

const biomeLinks: BiomeLinks = [BiomeId.PLAINS];

export const townBiome = new Biome(
  BiomeId.TOWN,
  pokemonPool,
  trainerPool,
  0,
  weatherPool,
  terrainPool,
  7.288,
  biomeLinks,
);
