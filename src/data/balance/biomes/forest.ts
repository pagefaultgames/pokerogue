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
      SpeciesId.BUTTERFREE,
      SpeciesId.BELLSPROUT,
      SpeciesId.COMBEE,
      SpeciesId.PETILIL,
      SpeciesId.DEERLING,
      SpeciesId.VIVILLON,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.BUTTERFREE,
      SpeciesId.BELLSPROUT,
      SpeciesId.BEAUTIFLY,
      SpeciesId.COMBEE,
      SpeciesId.PETILIL,
      SpeciesId.DEERLING,
      SpeciesId.VIVILLON,
    ],
    [TimeOfDay.DUSK]: [
      SpeciesId.BEEDRILL,
      SpeciesId.SPINARAK,
      SpeciesId.PINECO,
      SpeciesId.SEEDOT,
      SpeciesId.SHROOMISH,
      SpeciesId.VENIPEDE,
    ],
    [TimeOfDay.NIGHT]: [
      SpeciesId.BEEDRILL,
      SpeciesId.VENONAT,
      SpeciesId.SPINARAK,
      SpeciesId.PINECO,
      SpeciesId.DUSTOX,
      SpeciesId.SEEDOT,
      SpeciesId.SHROOMISH,
      SpeciesId.VENIPEDE,
    ],
    [TimeOfDay.ALL]: [SpeciesId.TAROUNTULA, SpeciesId.NYMBLE, SpeciesId.SHROODLE],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.ROSELIA, SpeciesId.MOTHIM, SpeciesId.SEWADDLE],
    [TimeOfDay.DAY]: [SpeciesId.ROSELIA, SpeciesId.MOTHIM, SpeciesId.SEWADDLE],
    [TimeOfDay.DUSK]: [SpeciesId.DOTTLER],
    [TimeOfDay.NIGHT]: [SpeciesId.HOOTHOOT, SpeciesId.ROCKRUFF, SpeciesId.DOTTLER],
    [TimeOfDay.ALL]: [SpeciesId.EKANS, SpeciesId.TEDDIURSA, SpeciesId.BURMY, SpeciesId.PANSAGE],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.EXEGGCUTE, SpeciesId.STANTLER],
    [TimeOfDay.DAY]: [SpeciesId.EXEGGCUTE, SpeciesId.STANTLER],
    [TimeOfDay.DUSK]: [SpeciesId.SCYTHER],
    [TimeOfDay.NIGHT]: [SpeciesId.SCYTHER],
    [TimeOfDay.ALL]: [
      SpeciesId.HERACROSS,
      SpeciesId.TREECKO,
      SpeciesId.TROPIUS,
      SpeciesId.KARRABLAST,
      SpeciesId.SHELMET,
      SpeciesId.CHESPIN,
      SpeciesId.ROWLET,
      SpeciesId.SQUAWKABILLY,
      SpeciesId.TOEDSCOOL,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.BLOODMOON_URSALUNA],
    [TimeOfDay.ALL]: [SpeciesId.DURANT],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.KARTANA, SpeciesId.WO_CHIEN],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.VICTREEBEL,
      SpeciesId.MOTHIM,
      SpeciesId.VESPIQUEN,
      SpeciesId.LILLIGANT,
      SpeciesId.SAWSBUCK,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.VICTREEBEL,
      SpeciesId.BEAUTIFLY,
      SpeciesId.MOTHIM,
      SpeciesId.VESPIQUEN,
      SpeciesId.LILLIGANT,
      SpeciesId.SAWSBUCK,
    ],
    [TimeOfDay.DUSK]: [
      SpeciesId.ARIADOS,
      SpeciesId.FORRETRESS,
      SpeciesId.SHIFTRY,
      SpeciesId.BRELOOM,
      SpeciesId.SCOLIPEDE,
      SpeciesId.ORBEETLE,
    ],
    [TimeOfDay.NIGHT]: [
      SpeciesId.VENOMOTH,
      SpeciesId.NOCTOWL,
      SpeciesId.ARIADOS,
      SpeciesId.FORRETRESS,
      SpeciesId.DUSTOX,
      SpeciesId.SHIFTRY,
      SpeciesId.BRELOOM,
      SpeciesId.SCOLIPEDE,
      SpeciesId.ORBEETLE,
    ],
    [TimeOfDay.ALL]: [SpeciesId.WORMADAM, SpeciesId.SIMISAGE, SpeciesId.SPIDOPS, SpeciesId.LOKIX, SpeciesId.GRAFAIAI],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.STANTLER],
    [TimeOfDay.DAY]: [SpeciesId.STANTLER],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.LYCANROC, SpeciesId.BLOODMOON_URSALUNA],
    [TimeOfDay.ALL]: [
      SpeciesId.HERACROSS,
      SpeciesId.SCEPTILE,
      SpeciesId.ESCAVALIER,
      SpeciesId.ACCELGOR,
      SpeciesId.DURANT,
      SpeciesId.CHESNAUGHT,
      SpeciesId.DECIDUEYE,
      SpeciesId.TOEDSCRUEL,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.KARTANA, SpeciesId.WO_CHIEN],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.CALYREX],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.BUG_CATCHER, TrainerType.RANGER],
  [BiomePoolTier.UNCOMMON]: [TrainerType.AROMA_LADY],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.BUGSY, TrainerType.BURGH, TrainerType.KATY],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 8,
  [WeatherType.RAIN]: 4,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.JUNGLE, BiomeId.MEADOW];

export const forestBiome = new Biome(
  BiomeId.FOREST,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  0.341,
  biomeLinks,
);
