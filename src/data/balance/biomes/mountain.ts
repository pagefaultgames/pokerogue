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
    [TimeOfDay.DAWN]: [SpeciesId.TAILLOW, SpeciesId.SWABLU, SpeciesId.STARLY, SpeciesId.PIDOVE, SpeciesId.FLETCHLING],
    [TimeOfDay.DAY]: [SpeciesId.TAILLOW, SpeciesId.SWABLU, SpeciesId.STARLY, SpeciesId.PIDOVE, SpeciesId.FLETCHLING],
    [TimeOfDay.DUSK]: [SpeciesId.RHYHORN, SpeciesId.ARON, SpeciesId.ROGGENROLA],
    [TimeOfDay.NIGHT]: [SpeciesId.RHYHORN, SpeciesId.ARON, SpeciesId.ROGGENROLA],
    [TimeOfDay.ALL]: [SpeciesId.PIDGEY, SpeciesId.SPEAROW, SpeciesId.SKIDDO],
  },
  [BiomePoolTier.UNCOMMON]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.RHYHORN,
      SpeciesId.ARON,
      SpeciesId.ROGGENROLA,
      SpeciesId.RUFFLET,
      SpeciesId.ROOKIDEE,
      SpeciesId.FLITTLE,
      SpeciesId.BOMBIRDIER,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.RHYHORN,
      SpeciesId.ARON,
      SpeciesId.ROGGENROLA,
      SpeciesId.RUFFLET,
      SpeciesId.ROOKIDEE,
      SpeciesId.FLITTLE,
      SpeciesId.BOMBIRDIER,
    ],
    [TimeOfDay.DUSK]: [SpeciesId.VULLABY],
    [TimeOfDay.NIGHT]: [SpeciesId.VULLABY],
    [TimeOfDay.ALL]: [SpeciesId.MACHOP, SpeciesId.GEODUDE, SpeciesId.NATU, SpeciesId.SLUGMA],
  },
  [BiomePoolTier.RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [SpeciesId.MURKROW],
    [TimeOfDay.ALL]: [SpeciesId.SKARMORY, SpeciesId.TORCHIC, SpeciesId.SPOINK, SpeciesId.HAWLUCHA, SpeciesId.NACLI],
  },
  [BiomePoolTier.SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.LARVITAR,
      SpeciesId.CRANIDOS,
      SpeciesId.SHIELDON,
      SpeciesId.GIBLE,
      SpeciesId.ARCHEOPS,
      SpeciesId.AXEW,
    ],
  },
  [BiomePoolTier.ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON],
  },
  [BiomePoolTier.BOSS]: {
    [TimeOfDay.DAWN]: [
      SpeciesId.SWELLOW,
      SpeciesId.ALTARIA,
      SpeciesId.STARAPTOR,
      SpeciesId.UNFEZANT,
      SpeciesId.BRAVIARY,
      SpeciesId.TALONFLAME,
      SpeciesId.CORVIKNIGHT,
      SpeciesId.ESPATHRA,
    ],
    [TimeOfDay.DAY]: [
      SpeciesId.SWELLOW,
      SpeciesId.ALTARIA,
      SpeciesId.STARAPTOR,
      SpeciesId.UNFEZANT,
      SpeciesId.BRAVIARY,
      SpeciesId.TALONFLAME,
      SpeciesId.CORVIKNIGHT,
      SpeciesId.ESPATHRA,
    ],
    [TimeOfDay.DUSK]: [SpeciesId.MANDIBUZZ],
    [TimeOfDay.NIGHT]: [SpeciesId.MANDIBUZZ],
    [TimeOfDay.ALL]: [SpeciesId.PIDGEOT, SpeciesId.FEAROW, SpeciesId.SKARMORY, SpeciesId.AGGRON, SpeciesId.GOGOAT],
  },
  [BiomePoolTier.BOSS_RARE]: {
    [TimeOfDay.DAWN]: [SpeciesId.HISUI_BRAVIARY],
    [TimeOfDay.DAY]: [SpeciesId.HISUI_BRAVIARY],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [
      SpeciesId.BLAZIKEN,
      SpeciesId.RAMPARDOS,
      SpeciesId.BASTIODON,
      SpeciesId.HAWLUCHA,
      SpeciesId.GARGANACL,
    ],
  },
  [BiomePoolTier.BOSS_SUPER_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON],
  },
  [BiomePoolTier.BOSS_ULTRA_RARE]: {
    [TimeOfDay.DAWN]: [],
    [TimeOfDay.DAY]: [],
    [TimeOfDay.DUSK]: [],
    [TimeOfDay.NIGHT]: [],
    [TimeOfDay.ALL]: [SpeciesId.HO_OH],
  },
};

const trainerPool: TrainerPools = {
  [BiomePoolTier.COMMON]: [
    TrainerType.BACKPACKER,
    TrainerType.BIRD_KEEPER,
    TrainerType.BLACK_BELT,
    TrainerType.CAMPER,
    TrainerType.HIKER,
  ],
  [BiomePoolTier.UNCOMMON]: [TrainerType.ACE_TRAINER, TrainerType.PILOT],
  [BiomePoolTier.RARE]: [],
  [BiomePoolTier.SUPER_RARE]: [],
  [BiomePoolTier.ULTRA_RARE]: [],
  [BiomePoolTier.BOSS]: [TrainerType.FALKNER, TrainerType.WINONA, TrainerType.SKYLA],
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

const biomeLinks: BiomeLinks = [BiomeId.VOLCANO, [BiomeId.WASTELAND, 2], [BiomeId.SPACE, 3]];

export const mountainBiome = new Biome(
  BiomeId.MOUNTAIN,
  pokemonPool,
  trainerPool,
  8,
  weatherPool,
  terrainPool,
  4.018,
  biomeLinks,
);
