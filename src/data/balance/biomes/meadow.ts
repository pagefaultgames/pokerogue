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
    [TimeOfDay.DAWN]: [SpeciesId.LEDYBA, SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO],
    [TimeOfDay.DAY]: [SpeciesId.LEDYBA, SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.BLITZLE, SpeciesId.FLABEBE, SpeciesId.CUTIEFLY, SpeciesId.GOSSIFLEUR, SpeciesId.WOOLOO],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [SpeciesId.PONYTA, SpeciesId.SNUBBULL, SpeciesId.SKITTY, SpeciesId.BOUFFALANT, SpeciesId.SMOLIV],
    [TimeOfDay.DAY]: [SpeciesId.PONYTA, SpeciesId.SNUBBULL, SpeciesId.SKITTY, SpeciesId.BOUFFALANT, SpeciesId.SMOLIV],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.JIGGLYPUFF, SpeciesId.MAREEP, SpeciesId.RALTS, SpeciesId.GLAMEOW, SpeciesId.ORICORIO],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.VOLBEAT, SpeciesId.ILLUMISE],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [SpeciesId.VOLBEAT, SpeciesId.ILLUMISE],
    [TimeOfDay.NIGHT]: [SpeciesId.VOLBEAT, SpeciesId.ILLUMISE],
    [TimeOfDay.ALL]: [
      SpeciesId.TAUROS,
      SpeciesId.EEVEE,
      SpeciesId.MILTANK,
      SpeciesId.SPINDA,
      SpeciesId.APPLIN,
      SpeciesId.SPRIGATITO,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.CHANSEY, SpeciesId.SYLVEON],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SHAYMIN, SpeciesId.MELOETTA],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.LEDIAN,
      SpeciesId.GRANBULL,
      SpeciesId.DELCATTY,
      SpeciesId.ROSERADE,
      SpeciesId.CINCCINO,
      SpeciesId.BOUFFALANT,
      SpeciesId.ARBOLIVA,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.LEDIAN,
      SpeciesId.GRANBULL,
      SpeciesId.DELCATTY,
      SpeciesId.ROSERADE,
      SpeciesId.CINCCINO,
      SpeciesId.BOUFFALANT,
      SpeciesId.ARBOLIVA,
    ],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.TAUROS,
      SpeciesId.MILTANK,
      SpeciesId.GARDEVOIR,
      SpeciesId.PURUGLY,
      SpeciesId.ZEBSTRIKA,
      SpeciesId.FLORGES,
      SpeciesId.RIBOMBEE,
      SpeciesId.DUBWOOL,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.HISUI_LILLIGANT],
    [TimeOfDay.DAY]: [SpeciesId.HISUI_LILLIGANT],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.BLISSEY,
      SpeciesId.SYLVEON,
      SpeciesId.FLAPPLE,
      SpeciesId.APPLETUN,
      SpeciesId.MEOWSCARADA,
      SpeciesId.HYDRAPPLE,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.SHAYMIN, SpeciesId.MELOETTA],
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
  [BiomePoolTier.COMMON]: [TrainerType.AROMA_LADY, TrainerType.BEAUTY, TrainerType.MUSICIAN, TrainerType.PARASOL_LADY],
  [BiomePoolTier.UNCOMMON]: [
    TrainerType.ACE_TRAINER,
    TrainerType.BAKER,
    TrainerType.BREEDER,
    TrainerType.FAIRY_TALE_GIRL,
    TrainerType.POKEFAN,
  ],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.LENORA, TrainerType.MILO],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.NONE]: 3,
  [WeatherType.SUNNY]: 5,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.PLAINS, BiomeId.FAIRY_CAVE];

export const meadowBiome = new Biome(
  BiomeId.MEADOW,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  3.891,
  biomeLinks,
);
