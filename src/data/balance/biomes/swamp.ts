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
    [TimeOfDay.DAWN]: [SpeciesId.WOOPER, SpeciesId.LOTAD],
    [TimeOfDay.DAY]: [SpeciesId.WOOPER, SpeciesId.LOTAD],
    [TimeOfDay.DUSK]: [SpeciesId.EKANS, SpeciesId.PALDEA_WOOPER],
    [TimeOfDay.NIGHT]: [SpeciesId.EKANS, SpeciesId.PALDEA_WOOPER],
    [TimeOfDay.ALL]: [SpeciesId.POLIWAG, SpeciesId.GULPIN, SpeciesId.SHELLOS, SpeciesId.TYMPOLE],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.EKANS],
    [TimeOfDay.DAY]: [SpeciesId.EKANS],
    [TimeOfDay.DUSK]: [SpeciesId.CROAGUNK],
    [TimeOfDay.NIGHT]: [SpeciesId.CROAGUNK],
    [TimeOfDay.ALL]: [SpeciesId.PSYDUCK, SpeciesId.BARBOACH, SpeciesId.SKORUPI, SpeciesId.STUNFISK, SpeciesId.MAREANIE],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TOTODILE, SpeciesId.MUDKIP],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.GALAR_SLOWPOKE, SpeciesId.HISUI_SLIGGOO],
    [TimeOfDay.DAY]: [SpeciesId.GALAR_SLOWPOKE, SpeciesId.HISUI_SLIGGOO],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.POLITOED, SpeciesId.GALAR_STUNFISK],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.AZELF, SpeciesId.POIPOLE],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.QUAGSIRE, SpeciesId.LUDICOLO],
    [TimeOfDay.DAY]: [SpeciesId.QUAGSIRE, SpeciesId.LUDICOLO],
    [TimeOfDay.DUSK]: [SpeciesId.ARBOK, SpeciesId.CLODSIRE],
    [TimeOfDay.NIGHT]: [SpeciesId.ARBOK, SpeciesId.CLODSIRE],
    [TimeOfDay.ALL]: [
      SpeciesId.POLIWRATH,
      SpeciesId.SWALOT,
      SpeciesId.WHISCASH,
      SpeciesId.GASTRODON,
      SpeciesId.SEISMITOAD,
      SpeciesId.STUNFISK,
      SpeciesId.TOXAPEX,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING, SpeciesId.HISUI_GOODRA],
    [TimeOfDay.DAY]: [SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING, SpeciesId.HISUI_GOODRA],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.FERALIGATR, SpeciesId.POLITOED, SpeciesId.SWAMPERT, SpeciesId.GALAR_STUNFISK],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.AZELF, SpeciesId.POIPOLE],
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
  [BiomePoolTier.COMMON]: [TrainerType.PARASOL_LADY],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER],
  [BiomePoolTier.RARE]: [TrainerType.BLACK_BELT],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.JANINE, TrainerType.ROXIE],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 3,
  [WeatherType.RAIN]: 4,
  [WeatherType.FOG]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.GRAVEYARD, BiomeId.TALL_GRASS];

export const swampBiome = new Biome(
  BiomeId.SWAMP,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  4.461,
  biomeLinks,
);
