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
    [TimeOfDay.DAWN]: [SpeciesId.SENTRET, SpeciesId.YUNGOOS, SpeciesId.SKWOVET],
    [TimeOfDay.DAY]: [SpeciesId.SENTRET, SpeciesId.YUNGOOS, SpeciesId.SKWOVET],
    [TimeOfDay.DUSK]: [SpeciesId.ZUBAT, SpeciesId.MEOWTH, SpeciesId.POOCHYENA],
    [TimeOfDay.NIGHT]: [SpeciesId.ZUBAT, SpeciesId.MEOWTH, SpeciesId.POOCHYENA],
    [TimeOfDay.ALL]: [SpeciesId.ZIGZAGOON, SpeciesId.BIDOOF, SpeciesId.LECHONK],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.DODUO,
      SpeciesId.POOCHYENA,
      SpeciesId.STARLY,
      SpeciesId.PIDOVE,
      SpeciesId.ROCKRUFF,
      SpeciesId.PAWMI,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.DODUO,
      SpeciesId.POOCHYENA,
      SpeciesId.STARLY,
      SpeciesId.PIDOVE,
      SpeciesId.ROCKRUFF,
      SpeciesId.PAWMI,
    ],
    [TimeOfDay.DUSK]: [SpeciesId.MANKEY, SpeciesId.NICKIT],
    [TimeOfDay.NIGHT]: [SpeciesId.MANKEY, SpeciesId.NICKIT],
    [TimeOfDay.ALL]: [SpeciesId.PIDGEY, SpeciesId.SPEAROW, SpeciesId.PIKACHU, SpeciesId.FLETCHLING],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.PALDEA_TAUROS],
    [TimeOfDay.DAY]: [SpeciesId.PALDEA_TAUROS],
    [TimeOfDay.DUSK]: [SpeciesId.SHINX],
    [TimeOfDay.NIGHT]: [SpeciesId.SHINX],
    [TimeOfDay.ALL]: [SpeciesId.ABRA, SpeciesId.BUNEARY, SpeciesId.ROOKIDEE],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.FARFETCHD,
      SpeciesId.LICKITUNG,
      SpeciesId.CHANSEY,
      SpeciesId.EEVEE,
      SpeciesId.SNORLAX,
      SpeciesId.DUNSPARCE,
    ],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.DITTO, SpeciesId.LATIAS, SpeciesId.LATIOS],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [SpeciesId.DODRIO, SpeciesId.FURRET, SpeciesId.GUMSHOOS, SpeciesId.GREEDENT],
    [TimeOfDay.DAY]: [SpeciesId.DODRIO, SpeciesId.FURRET, SpeciesId.GUMSHOOS, SpeciesId.GREEDENT],
    [TimeOfDay.DUSK]: [SpeciesId.PERSIAN, SpeciesId.MIGHTYENA],
    [TimeOfDay.NIGHT]: [SpeciesId.PERSIAN, SpeciesId.MIGHTYENA],
    [TimeOfDay.ALL]: [SpeciesId.LINOONE, SpeciesId.BIBAREL, SpeciesId.LOPUNNY, SpeciesId.OINKOLOGNE],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.PAWMOT, SpeciesId.PALDEA_TAUROS],
    [TimeOfDay.DAY]: [SpeciesId.LYCANROC, SpeciesId.PAWMOT, SpeciesId.PALDEA_TAUROS],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.FARFETCHD, SpeciesId.SNORLAX, SpeciesId.LICKILICKY, SpeciesId.DUDUNSPARCE],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.LATIAS, SpeciesId.LATIOS],
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
  [BiomePoolTier.COMMON]: [TrainerType.BREEDER, TrainerType.TWINS],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER, TrainerType.CYCLIST],
  [BiomePoolTier.RARE]: [TrainerType.BLACK_BELT],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.CILAN, TrainerType.CHILI, TrainerType.CRESS, TrainerType.CHEREN],
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

const biomeLinks: BiomeLinks = [BiomeId.GRASS, BiomeId.METROPOLIS, BiomeId.LAKE];

export const plainsBiome = new Biome(
  BiomeId.PLAINS,
  pokemonPool,
  trainerPool,
  6,
  weatherPool,
  terrainPool,
  17.485,
  biomeLinks,
);
