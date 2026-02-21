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
      SpeciesId.CHINCHOU,
      SpeciesId.REMORAID,
      SpeciesId.CLAMPERL,
      SpeciesId.BASCULIN,
      SpeciesId.FRILLISH,
      SpeciesId.ARROKUDA,
      SpeciesId.VELUZA,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.TENTACOOL,
      SpeciesId.SHELLDER,
      SpeciesId.WAILMER,
      SpeciesId.LUVDISC,
      SpeciesId.SHELLOS,
      SpeciesId.SKRELP,
      SpeciesId.PINCURCHIN,
      SpeciesId.DONDOZO,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.QWILFISH,
      SpeciesId.CORSOLA,
      SpeciesId.OCTILLERY,
      SpeciesId.FEEBAS,
      SpeciesId.MANTYKE,
      SpeciesId.ALOMOMOLA,
      SpeciesId.TYNAMO,
      SpeciesId.DHELMISE,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.OMANYTE,
      SpeciesId.KABUTO,
      SpeciesId.RELICANTH,
      SpeciesId.PYUKUMUKU,
      SpeciesId.GALAR_CORSOLA,
      SpeciesId.ARCTOVISH,
      SpeciesId.HISUI_QWILFISH,
    ],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.NIHILEGO],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.LANTURN,
      SpeciesId.QWILFISH,
      SpeciesId.CORSOLA,
      SpeciesId.OCTILLERY,
      SpeciesId.MANTINE,
      SpeciesId.WAILORD,
      SpeciesId.HUNTAIL,
      SpeciesId.GOREBYSS,
      SpeciesId.LUVDISC,
      SpeciesId.JELLICENT,
      SpeciesId.ALOMOMOLA,
      SpeciesId.DRAGALGE,
      SpeciesId.BARRASKEWDA,
      SpeciesId.DONDOZO,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.OMASTAR,
      SpeciesId.KABUTOPS,
      SpeciesId.MILOTIC,
      SpeciesId.RELICANTH,
      SpeciesId.EELEKTROSS,
      SpeciesId.PYUKUMUKU,
      SpeciesId.DHELMISE,
      SpeciesId.CURSOLA,
      SpeciesId.ARCTOVISH,
      SpeciesId.BASCULEGION,
      SpeciesId.OVERQWIL,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.NIHILEGO],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.KYOGRE],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.SCUBA_DIVER],
  [BiomePoolTier.UNCOMMON]: [],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.JUAN],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.RAIN]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.CAVE, [BiomeId.VOLCANO, 3]];

export const seabedBiome = new Biome(
  BiomeId.SEABED,
  pokemonPool,
  trainerPool,
  16,
  weatherPool,
  terrainPool,
  2.6,
  biomeLinks,
);
