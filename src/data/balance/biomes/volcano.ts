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
      SpeciesId.VULPIX,
      SpeciesId.GROWLITHE,
      SpeciesId.PONYTA,
      SpeciesId.SLUGMA,
      SpeciesId.POOCHYENA,
      SpeciesId.NUMEL,
      SpeciesId.SPOINK,
      SpeciesId.SWABLU,
      SpeciesId.ROLYCOLY,
    ],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.MAGMAR,
      SpeciesId.MEDITITE,
      SpeciesId.TORKOAL,
      SpeciesId.PANSEAR,
      SpeciesId.HEATMOR,
      SpeciesId.SALANDIT,
      SpeciesId.TURTONATOR,
      SpeciesId.ALOLA_DIGLETT,
    ],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.CHARMANDER,
      SpeciesId.CYNDAQUIL,
      SpeciesId.CHIMCHAR,
      SpeciesId.TEPIG,
      SpeciesId.FENNEKIN,
      SpeciesId.LITTEN,
      SpeciesId.SCORBUNNY,
      SpeciesId.CHARCADET,
    ],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.FLAREON, SpeciesId.LARVESTA, SpeciesId.HISUI_GROWLITHE],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.MOLTRES, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.NINETALES,
      SpeciesId.ARCANINE,
      SpeciesId.RAPIDASH,
      SpeciesId.MAGCARGO,
      SpeciesId.CAMERUPT,
      SpeciesId.TORKOAL,
      SpeciesId.MAGMORTAR,
      SpeciesId.SIMISEAR,
      SpeciesId.HEATMOR,
      SpeciesId.SALAZZLE,
      SpeciesId.TURTONATOR,
      SpeciesId.COALOSSAL,
      SpeciesId.ALOLA_DUGTRIO,
    ],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.CHARIZARD,
      SpeciesId.FLAREON,
      SpeciesId.TYPHLOSION,
      SpeciesId.INFERNAPE,
      SpeciesId.EMBOAR,
      SpeciesId.VOLCARONA,
      SpeciesId.DELPHOX,
      SpeciesId.INCINEROAR,
      SpeciesId.CINDERACE,
      SpeciesId.ARMAROUGE,
      SpeciesId.HISUI_ARCANINE,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.MOLTRES, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.RESHIRAM],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [TrainerType.FIREBREATHER, TrainerType.HIKER],
  [BiomePoolTier.UNCOMMON]: [TrainerType.DRAGON_TAMER],
  [BiomePoolTier.RARE]: [TrainerType.BREEDER],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.BLAINE, TrainerType.FLANNERY, TrainerType.KABU],
  [BiomePoolTier.BOSS_RARE]: [],
  [BiomePoolTier.BOSS_SUPER_RARE]: [],
  [BiomePoolTier.BOSS_ULTRA_RARE]: [],
};

const weatherPool: WeatherPool = {
  [WeatherType.SUNNY]: 1,
};

const terrainPool: TerrainPool = {
  [TerrainType.NONE]: 1,
};

const biomeLinks: BiomeLinks = [BiomeId.BEACH, [BiomeId.ICE_CAVE, 3]];

export const volcanoBiome = new Biome(
  BiomeId.VOLCANO,
  pokemonPool,
  trainerPool,
  12,
  weatherPool,
  terrainPool,
  17.637,
  biomeLinks,
);
