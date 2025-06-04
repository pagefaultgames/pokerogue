import { PokemonType } from "#enums/pokemon-type";
import { randSeedInt, getEnumValues } from "#app/utils/common";
import type { SpeciesFormEvolution } from "#app/data/balance/pokemon-evolutions";
import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import i18next from "i18next";
import { Biome } from "#enums/biome";
import { SpeciesId } from "#enums/species";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
// import beautify from "json-beautify";

export function getBiomeName(biome: Biome | -1) {
  if (biome === -1) {
    return i18next.t("biome:unknownLocation");
  }
  switch (biome) {
    case Biome.GRASS:
      return i18next.t("biome:GRASS");
    case Biome.RUINS:
      return i18next.t("biome:RUINS");
    case Biome.END:
      return i18next.t("biome:END");
    default:
      return i18next.t(`biome:${Biome[biome].toUpperCase()}`);
  }
}

interface BiomeLinks {
  [key: number]: Biome | (Biome | [Biome, number])[]
}

interface BiomeDepths {
  [key: number]: [number, number]
}

export const biomeLinks: BiomeLinks = {
  [Biome.TOWN]: Biome.PLAINS,
  [Biome.PLAINS]: [ Biome.GRASS, Biome.METROPOLIS, Biome.LAKE ],
  [Biome.GRASS]: Biome.TALL_GRASS,
  [Biome.TALL_GRASS]: [ Biome.FOREST, Biome.CAVE ],
  [Biome.SLUM]: [ Biome.CONSTRUCTION_SITE, [ Biome.SWAMP, 2 ]],
  [Biome.FOREST]: [ Biome.JUNGLE, Biome.MEADOW ],
  [Biome.SEA]: [ Biome.SEABED, Biome.ICE_CAVE ],
  [Biome.SWAMP]: [ Biome.GRAVEYARD, Biome.TALL_GRASS ],
  [Biome.BEACH]: [ Biome.SEA, [ Biome.ISLAND, 2 ]],
  [Biome.LAKE]: [ Biome.BEACH, Biome.SWAMP, Biome.CONSTRUCTION_SITE ],
  [Biome.SEABED]: [ Biome.CAVE, [ Biome.VOLCANO, 3 ]],
  [Biome.MOUNTAIN]: [ Biome.VOLCANO, [ Biome.WASTELAND, 2 ], [ Biome.SPACE, 3 ]],
  [Biome.BADLANDS]: [ Biome.DESERT, Biome.MOUNTAIN ],
  [Biome.CAVE]: [ Biome.BADLANDS, Biome.LAKE, [ Biome.LABORATORY, 2 ]],
  [Biome.DESERT]: [ Biome.RUINS, [ Biome.CONSTRUCTION_SITE, 2 ]],
  [Biome.ICE_CAVE]: Biome.SNOWY_FOREST,
  [Biome.MEADOW]: [ Biome.PLAINS, Biome.FAIRY_CAVE ],
  [Biome.POWER_PLANT]: Biome.FACTORY,
  [Biome.VOLCANO]: [ Biome.BEACH, [ Biome.ICE_CAVE, 3 ]],
  [Biome.GRAVEYARD]: Biome.ABYSS,
  [Biome.DOJO]: [ Biome.PLAINS, [ Biome.JUNGLE, 2 ], [ Biome.TEMPLE, 2 ]],
  [Biome.FACTORY]: [ Biome.PLAINS, [ Biome.LABORATORY, 2 ]],
  [Biome.RUINS]: [ Biome.MOUNTAIN, [ Biome.FOREST, 2 ]],
  [Biome.WASTELAND]: Biome.BADLANDS,
  [Biome.ABYSS]: [ Biome.CAVE, [ Biome.SPACE, 2 ], [ Biome.WASTELAND, 2 ]],
  [Biome.SPACE]: Biome.RUINS,
  [Biome.CONSTRUCTION_SITE]: [ Biome.POWER_PLANT, [ Biome.DOJO, 2 ]],
  [Biome.JUNGLE]: [ Biome.TEMPLE ],
  [Biome.FAIRY_CAVE]: [ Biome.ICE_CAVE, [ Biome.SPACE, 2 ]],
  [Biome.TEMPLE]: [ Biome.DESERT, [ Biome.SWAMP, 2 ], [ Biome.RUINS, 2 ]],
  [Biome.METROPOLIS]: Biome.SLUM,
  [Biome.SNOWY_FOREST]: [ Biome.FOREST, [ Biome.MOUNTAIN, 2 ], [ Biome.LAKE, 2 ]],
  [Biome.ISLAND]: Biome.SEA,
  [Biome.LABORATORY]: Biome.CONSTRUCTION_SITE
};

export const biomeDepths: BiomeDepths = {};

export enum BiomePoolTier {
  COMMON,
  UNCOMMON,
  RARE,
  SUPER_RARE,
  ULTRA_RARE,
  BOSS,
  BOSS_RARE,
  BOSS_SUPER_RARE,
  BOSS_ULTRA_RARE
}

export const uncatchableSpecies: SpeciesId[] = [];

export interface SpeciesTree {
  [key: number]: SpeciesId[]
}

export interface PokemonPools {
  [key: number]: (SpeciesId | SpeciesTree)[]
}

export interface BiomeTierPokemonPools {
  [key: number]: PokemonPools
}

export interface BiomePokemonPools {
  [key: number]: BiomeTierPokemonPools
}

export interface BiomeTierTod {
  biome: Biome,
  tier: BiomePoolTier,
  tod: TimeOfDay[]
}

export interface CatchableSpecies{
  [key: number]: BiomeTierTod[]
}

export const catchableSpecies: CatchableSpecies = {};

export interface BiomeTierTrainerPools {
  [key: number]: TrainerType[]
}

export interface BiomeTrainerPools {
  [key: number]: BiomeTierTrainerPools
}

export const biomePokemonPools: BiomePokemonPools = {
  [Biome.TOWN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.CATERPIE ], 7: [ SpeciesId.METAPOD ]},
        SpeciesId.SENTRET,
        SpeciesId.LEDYBA,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        { 1: [ SpeciesId.SCATTERBUG ], 9: [ SpeciesId.SPEWPA ]},
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.CATERPIE ], 7: [ SpeciesId.METAPOD ]},
        SpeciesId.SENTRET,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.SILCOON,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        { 1: [ SpeciesId.SCATTERBUG ], 9: [ SpeciesId.SPEWPA ]},
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.WEEDLE ], 7: [ SpeciesId.KAKUNA ]}, SpeciesId.POOCHYENA, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.WEEDLE ], 7: [ SpeciesId.KAKUNA ]}, SpeciesId.HOOTHOOT, SpeciesId.SPINARAK, SpeciesId.POOCHYENA, SpeciesId.CASCOON, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
      [TimeOfDay.ALL]: [ SpeciesId.PIDGEY, SpeciesId.RATTATA, SpeciesId.SPEAROW, SpeciesId.ZIGZAGOON, SpeciesId.WURMPLE, SpeciesId.TAILLOW, SpeciesId.BIDOOF, SpeciesId.LILLIPUP, SpeciesId.FLETCHLING, SpeciesId.WOOLOO, SpeciesId.LECHONK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.BELLSPROUT, SpeciesId.POOCHYENA, SpeciesId.LOTAD, SpeciesId.SKITTY, SpeciesId.COMBEE, SpeciesId.CHERUBI, SpeciesId.PATRAT, SpeciesId.MINCCINO, SpeciesId.PAWMI ],
      [TimeOfDay.DAY]: [ SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_M, SpeciesId.BELLSPROUT, SpeciesId.POOCHYENA, SpeciesId.LOTAD, SpeciesId.SKITTY, SpeciesId.COMBEE, SpeciesId.CHERUBI, SpeciesId.PATRAT, SpeciesId.MINCCINO, SpeciesId.PAWMI ],
      [TimeOfDay.DUSK]: [ SpeciesId.EKANS, SpeciesId.ODDISH, SpeciesId.MEOWTH, SpeciesId.SPINARAK, SpeciesId.SEEDOT, SpeciesId.SHROOMISH, SpeciesId.KRICKETOT, SpeciesId.VENIPEDE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.EKANS, SpeciesId.ODDISH, SpeciesId.PARAS, SpeciesId.VENONAT, SpeciesId.MEOWTH, SpeciesId.SEEDOT, SpeciesId.SHROOMISH, SpeciesId.KRICKETOT, SpeciesId.VENIPEDE ],
      [TimeOfDay.ALL]: [ SpeciesId.NINCADA, SpeciesId.WHISMUR, SpeciesId.FIDOUGH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.TANDEMAUS ], [TimeOfDay.DAY]: [ SpeciesId.TANDEMAUS ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ABRA, SpeciesId.SURSKIT, SpeciesId.ROOKIDEE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.EEVEE, SpeciesId.RALTS ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.PLAINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.SENTRET ], 15: [ SpeciesId.FURRET ]}, { 1: [ SpeciesId.YUNGOOS ], 30: [ SpeciesId.GUMSHOOS ]}, { 1: [ SpeciesId.SKWOVET ], 24: [ SpeciesId.GREEDENT ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.SENTRET ], 15: [ SpeciesId.FURRET ]}, { 1: [ SpeciesId.YUNGOOS ], 30: [ SpeciesId.GUMSHOOS ]}, { 1: [ SpeciesId.SKWOVET ], 24: [ SpeciesId.GREEDENT ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.MEOWTH ], 28: [ SpeciesId.PERSIAN ]}, { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.ZUBAT ], 22: [ SpeciesId.GOLBAT ]}, { 1: [ SpeciesId.MEOWTH ], 28: [ SpeciesId.PERSIAN ]}, { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.ZIGZAGOON ], 20: [ SpeciesId.LINOONE ]}, { 1: [ SpeciesId.BIDOOF ], 15: [ SpeciesId.BIBAREL ]}, { 1: [ SpeciesId.LECHONK ], 18: [ SpeciesId.OINKOLOGNE ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.DODUO ], 31: [ SpeciesId.DODRIO ]},
        { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ]},
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ]},
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ]},
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.DODUO ], 31: [ SpeciesId.DODRIO ]},
        { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ]},
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ]},
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ]},
        { 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ]},
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PIDGEY ], 18: [ SpeciesId.PIDGEOTTO ], 36: [ SpeciesId.PIDGEOT ]},
        { 1: [ SpeciesId.SPEAROW ], 20: [ SpeciesId.FEAROW ]},
        SpeciesId.PIKACHU,
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.ABRA ], 16: [ SpeciesId.KADABRA ]}, { 1: [ SpeciesId.BUNEARY ], 20: [ SpeciesId.LOPUNNY ]}, { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FARFETCHD, SpeciesId.LICKITUNG, SpeciesId.CHANSEY, SpeciesId.EEVEE, SpeciesId.SNORLAX, { 1: [ SpeciesId.DUNSPARCE ], 62: [ SpeciesId.DUDUNSPARCE ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.LATIAS, SpeciesId.LATIOS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.DODRIO, SpeciesId.FURRET, SpeciesId.GUMSHOOS, SpeciesId.GREEDENT ],
      [TimeOfDay.DAY]: [ SpeciesId.DODRIO, SpeciesId.FURRET, SpeciesId.GUMSHOOS, SpeciesId.GREEDENT ],
      [TimeOfDay.DUSK]: [ SpeciesId.PERSIAN, SpeciesId.MIGHTYENA ],
      [TimeOfDay.NIGHT]: [ SpeciesId.PERSIAN, SpeciesId.MIGHTYENA ],
      [TimeOfDay.ALL]: [ SpeciesId.LINOONE, SpeciesId.BIBAREL, SpeciesId.LOPUNNY, SpeciesId.OINKOLOGNE ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PAWMOT, SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ SpeciesId.LYCANROC, SpeciesId.PAWMOT, SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.FARFETCHD, SpeciesId.SNORLAX, SpeciesId.LICKILICKY, SpeciesId.DUDUNSPARCE ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LATIAS, SpeciesId.LATIOS ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.HOPPIP ], 18: [ SpeciesId.SKIPLOOM ]}, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.HOPPIP ], 18: [ SpeciesId.SKIPLOOM ]}, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ]}, { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ]}, { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ]}],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ]}, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ]}, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BULBASAUR ], 16: [ SpeciesId.IVYSAUR ], 32: [ SpeciesId.VENUSAUR ]}, SpeciesId.GROWLITHE, { 1: [ SpeciesId.TURTWIG ], 18: [ SpeciesId.GROTLE ], 32: [ SpeciesId.TORTERRA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUDOWOODO ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VIRIZION ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.JUMPLUFF, SpeciesId.SUNFLORA, SpeciesId.WHIMSICOTT ], [TimeOfDay.DAY]: [ SpeciesId.JUMPLUFF, SpeciesId.SUNFLORA, SpeciesId.WHIMSICOTT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VENUSAUR, SpeciesId.SUDOWOODO, SpeciesId.TORTERRA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VIRIZION ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.BOUNSWEET ], 18: [ SpeciesId.STEENEE ], 58: [ SpeciesId.TSAREENA ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.NIDORAN_F ], 16: [ SpeciesId.NIDORINA ]}, { 1: [ SpeciesId.NIDORAN_M ], 16: [ SpeciesId.NIDORINO ]}, { 1: [ SpeciesId.BOUNSWEET ], 18: [ SpeciesId.STEENEE ], 58: [ SpeciesId.TSAREENA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.ODDISH ], 21: [ SpeciesId.GLOOM ]}, { 1: [ SpeciesId.KRICKETOT ], 10: [ SpeciesId.KRICKETUNE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.ODDISH ], 21: [ SpeciesId.GLOOM ]}, { 1: [ SpeciesId.KRICKETOT ], 10: [ SpeciesId.KRICKETUNE ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.NINCADA ], 20: [ SpeciesId.NINJASK ]}, { 1: [ SpeciesId.FOMANTIS ], 44: [ SpeciesId.LURANTIS ]}, { 1: [ SpeciesId.NYMBLE ], 24: [ SpeciesId.LOKIX ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.PARAS ], 24: [ SpeciesId.PARASECT ]}, { 1: [ SpeciesId.VENONAT ], 31: [ SpeciesId.VENOMOTH ]}, { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ]}],
      [TimeOfDay.ALL]: [ SpeciesId.VULPIX ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.PINSIR, { 1: [ SpeciesId.CHIKORITA ], 16: [ SpeciesId.BAYLEEF ], 32: [ SpeciesId.MEGANIUM ]}, { 1: [ SpeciesId.GIRAFARIG ], 62: [ SpeciesId.FARIGIRAF ]}, SpeciesId.ZANGOOSE, SpeciesId.KECLEON, SpeciesId.TROPIUS ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SCYTHER, SpeciesId.SHEDINJA, SpeciesId.ROTOM ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.TSAREENA ],
      [TimeOfDay.DAY]: [ SpeciesId.NIDOQUEEN, SpeciesId.NIDOKING, SpeciesId.TSAREENA ],
      [TimeOfDay.DUSK]: [ SpeciesId.VILEPLUME, SpeciesId.KRICKETUNE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.VILEPLUME, SpeciesId.KRICKETUNE ],
      [TimeOfDay.ALL]: [ SpeciesId.NINJASK, SpeciesId.ZANGOOSE, SpeciesId.KECLEON, SpeciesId.LURANTIS, SpeciesId.LOKIX ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.BELLOSSOM ], [TimeOfDay.DAY]: [ SpeciesId.BELLOSSOM ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PINSIR, SpeciesId.MEGANIUM, SpeciesId.FARIGIRAF ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.YAMPER ], 25: [ SpeciesId.BOLTUND ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.YAMPER ], 25: [ SpeciesId.BOLTUND ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.HOUNDOUR ], 24: [ SpeciesId.HOUNDOOM ]}, { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.RATTATA ], 20: [ SpeciesId.RATICATE ]}, { 1: [ SpeciesId.ZIGZAGOON ], 20: [ SpeciesId.LINOONE ]}, { 1: [ SpeciesId.LILLIPUP ], 16: [ SpeciesId.HERDIER ], 32: [ SpeciesId.STOUTLAND ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}, SpeciesId.INDEEDEE ],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}, SpeciesId.INDEEDEE ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.ESPURR ], 25: [ SpeciesId.MEOWSTIC ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.ESPURR ], 25: [ SpeciesId.MEOWSTIC ]}],
      [TimeOfDay.ALL]: [ SpeciesId.PIKACHU, { 1: [ SpeciesId.GLAMEOW ], 38: [ SpeciesId.PURUGLY ]}, SpeciesId.FURFROU, { 1: [ SpeciesId.FIDOUGH ], 26: [ SpeciesId.DACHSBUN ]}, SpeciesId.SQUAWKABILLY ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.TANDEMAUS ], 25: [ SpeciesId.MAUSHOLD ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.TANDEMAUS ], 25: [ SpeciesId.MAUSHOLD ]}],
      [TimeOfDay.DUSK]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.VAROOM ], 40: [ SpeciesId.REVAVROOM ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.EEVEE, SpeciesId.SMEARGLE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CASTFORM ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.BOLTUND ], [TimeOfDay.DAY]: [ SpeciesId.BOLTUND ], [TimeOfDay.DUSK]: [ SpeciesId.MEOWSTIC ], [TimeOfDay.NIGHT]: [ SpeciesId.MEOWSTIC ], [TimeOfDay.ALL]: [ SpeciesId.STOUTLAND, SpeciesId.FURFROU, SpeciesId.DACHSBUN ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.MAUSHOLD ], [TimeOfDay.DAY]: [ SpeciesId.MAUSHOLD ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CASTFORM, SpeciesId.REVAVROOM ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.BUTTERFREE,
        { 1: [ SpeciesId.BELLSPROUT ], 21: [ SpeciesId.WEEPINBELL ]},
        { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ]},
        SpeciesId.PETILIL,
        { 1: [ SpeciesId.DEERLING ], 34: [ SpeciesId.SAWSBUCK ]},
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.BUTTERFREE,
        { 1: [ SpeciesId.BELLSPROUT ], 21: [ SpeciesId.WEEPINBELL ]},
        SpeciesId.BEAUTIFLY,
        { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ]},
        SpeciesId.PETILIL,
        { 1: [ SpeciesId.DEERLING ], 34: [ SpeciesId.SAWSBUCK ]},
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DUSK]: [
        SpeciesId.BEEDRILL,
        { 1: [ SpeciesId.PINECO ], 31: [ SpeciesId.FORRETRESS ]},
        { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ]},
        { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ]},
        { 1: [ SpeciesId.VENIPEDE ], 22: [ SpeciesId.WHIRLIPEDE ], 30: [ SpeciesId.SCOLIPEDE ]}
      ],
      [TimeOfDay.NIGHT]: [
        SpeciesId.BEEDRILL,
        { 1: [ SpeciesId.VENONAT ], 31: [ SpeciesId.VENOMOTH ]},
        { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ]},
        { 1: [ SpeciesId.PINECO ], 31: [ SpeciesId.FORRETRESS ]},
        SpeciesId.DUSTOX,
        { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ]},
        { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ]},
        { 1: [ SpeciesId.VENIPEDE ], 22: [ SpeciesId.WHIRLIPEDE ], 30: [ SpeciesId.SCOLIPEDE ]}
      ],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.TAROUNTULA ], 15: [ SpeciesId.SPIDOPS ]}, { 1: [ SpeciesId.NYMBLE ], 24: [ SpeciesId.LOKIX ]}, { 1: [ SpeciesId.SHROODLE ], 28: [ SpeciesId.GRAFAIAI ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ]}],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ]}, { 1: [ SpeciesId.DOTTLER ], 30: [ SpeciesId.ORBEETLE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.HOOTHOOT ], 20: [ SpeciesId.NOCTOWL ]}, { 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ]}, { 1: [ SpeciesId.DOTTLER ], 30: [ SpeciesId.ORBEETLE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ]},
        { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]},
        { 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ]},
        { 1: [ SpeciesId.PANSAGE ], 30: [ SpeciesId.SIMISAGE ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.ALL]: [
        SpeciesId.HERACROSS,
        { 1: [ SpeciesId.TREECKO ], 16: [ SpeciesId.GROVYLE ], 36: [ SpeciesId.SCEPTILE ]},
        SpeciesId.TROPIUS,
        SpeciesId.KARRABLAST,
        SpeciesId.SHELMET,
        { 1: [ SpeciesId.CHESPIN ], 16: [ SpeciesId.QUILLADIN ], 36: [ SpeciesId.CHESNAUGHT ]},
        { 1: [ SpeciesId.ROWLET ], 17: [ SpeciesId.DARTRIX ], 34: [ SpeciesId.DECIDUEYE ]},
        SpeciesId.SQUAWKABILLY,
        { 1: [ SpeciesId.TOEDSCOOL ], 30: [ SpeciesId.TOEDSCRUEL ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.BLOODMOON_URSALUNA ], [TimeOfDay.ALL]: [ SpeciesId.DURANT ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KARTANA, SpeciesId.WO_CHIEN ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.VICTREEBEL, SpeciesId.MOTHIM, SpeciesId.VESPIQUEN, SpeciesId.LILLIGANT, SpeciesId.SAWSBUCK ],
      [TimeOfDay.DAY]: [ SpeciesId.VICTREEBEL, SpeciesId.BEAUTIFLY, SpeciesId.MOTHIM, SpeciesId.VESPIQUEN, SpeciesId.LILLIGANT, SpeciesId.SAWSBUCK ],
      [TimeOfDay.DUSK]: [ SpeciesId.ARIADOS, SpeciesId.FORRETRESS, SpeciesId.SHIFTRY, SpeciesId.BRELOOM, SpeciesId.SCOLIPEDE, SpeciesId.ORBEETLE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.VENOMOTH, SpeciesId.NOCTOWL, SpeciesId.ARIADOS, SpeciesId.FORRETRESS, SpeciesId.DUSTOX, SpeciesId.SHIFTRY, SpeciesId.BRELOOM, SpeciesId.SCOLIPEDE, SpeciesId.ORBEETLE ],
      [TimeOfDay.ALL]: [ SpeciesId.WORMADAM, SpeciesId.SIMISAGE, SpeciesId.SPIDOPS, SpeciesId.LOKIX, SpeciesId.GRAFAIAI ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.LYCANROC, SpeciesId.BLOODMOON_URSALUNA ],
      [TimeOfDay.ALL]: [ SpeciesId.HERACROSS, SpeciesId.SCEPTILE, SpeciesId.ESCAVALIER, SpeciesId.ACCELGOR, SpeciesId.DURANT, SpeciesId.CHESNAUGHT, SpeciesId.DECIDUEYE, SpeciesId.TOEDSCRUEL ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KARTANA, SpeciesId.WO_CHIEN ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CALYREX ]}
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ]}, { 1: [ SpeciesId.WINGULL ], 25: [ SpeciesId.PELIPPER ]}, SpeciesId.CRAMORANT, { 1: [ SpeciesId.FINIZEN ], 38: [ SpeciesId.PALAFIN ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ]}, { 1: [ SpeciesId.WINGULL ], 25: [ SpeciesId.PELIPPER ]}, SpeciesId.CRAMORANT, { 1: [ SpeciesId.FINIZEN ], 38: [ SpeciesId.PALAFIN ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.INKAY ], 30: [ SpeciesId.MALAMAR ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.FINNEON ], 31: [ SpeciesId.LUMINEON ]}, { 1: [ SpeciesId.INKAY ], 30: [ SpeciesId.MALAMAR ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.TENTACOOL ], 30: [ SpeciesId.TENTACRUEL ]}, { 1: [ SpeciesId.MAGIKARP ], 20: [ SpeciesId.GYARADOS ]}, { 1: [ SpeciesId.BUIZEL ], 26: [ SpeciesId.FLOATZEL ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ]}, SpeciesId.SHELLDER, { 1: [ SpeciesId.CARVANHA ], 30: [ SpeciesId.SHARPEDO ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ]}, SpeciesId.SHELLDER, { 1: [ SpeciesId.CHINCHOU ], 27: [ SpeciesId.LANTURN ]}, { 1: [ SpeciesId.CARVANHA ], 30: [ SpeciesId.SHARPEDO ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.POLIWAG ], 25: [ SpeciesId.POLIWHIRL ]},
        { 1: [ SpeciesId.HORSEA ], 32: [ SpeciesId.SEADRA ]},
        { 1: [ SpeciesId.GOLDEEN ], 33: [ SpeciesId.SEAKING ]},
        { 1: [ SpeciesId.WAILMER ], 40: [ SpeciesId.WAILORD ]},
        { 1: [ SpeciesId.PANPOUR ], 30: [ SpeciesId.SIMIPOUR ]},
        { 1: [ SpeciesId.WATTREL ], 25: [ SpeciesId.KILOWATTREL ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.LAPRAS, { 1: [ SpeciesId.PIPLUP ], 16: [ SpeciesId.PRINPLUP ], 36: [ SpeciesId.EMPOLEON ]}, { 1: [ SpeciesId.POPPLIO ], 17: [ SpeciesId.BRIONNE ], 34: [ SpeciesId.PRIMARINA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KINGDRA, SpeciesId.ROTOM, { 1: [ SpeciesId.TIRTOUGA ], 37: [ SpeciesId.CARRACOSTA ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PELIPPER, SpeciesId.CRAMORANT, SpeciesId.PALAFIN ],
      [TimeOfDay.DAY]: [ SpeciesId.PELIPPER, SpeciesId.CRAMORANT, SpeciesId.PALAFIN ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHARPEDO, SpeciesId.MALAMAR ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHARPEDO, SpeciesId.LUMINEON, SpeciesId.MALAMAR ],
      [TimeOfDay.ALL]: [ SpeciesId.TENTACRUEL, SpeciesId.FLOATZEL, SpeciesId.SIMIPOUR, SpeciesId.KILOWATTREL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KINGDRA, SpeciesId.EMPOLEON, SpeciesId.PRIMARINA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LUGIA ]}
  },
  [Biome.SWAMP]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ]}, { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ]}, { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ]}, { 1: [ SpeciesId.PALDEA_WOOPER ], 20: [ SpeciesId.CLODSIRE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ]}, { 1: [ SpeciesId.PALDEA_WOOPER ], 20: [ SpeciesId.CLODSIRE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.POLIWAG ], 25: [ SpeciesId.POLIWHIRL ]},
        { 1: [ SpeciesId.GULPIN ], 26: [ SpeciesId.SWALOT ]},
        { 1: [ SpeciesId.SHELLOS ], 30: [ SpeciesId.GASTRODON ]},
        { 1: [ SpeciesId.TYMPOLE ], 25: [ SpeciesId.PALPITOAD ], 36: [ SpeciesId.SEISMITOAD ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PSYDUCK ], 33: [ SpeciesId.GOLDUCK ]},
        { 1: [ SpeciesId.BARBOACH ], 30: [ SpeciesId.WHISCASH ]},
        { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ]},
        SpeciesId.STUNFISK,
        { 1: [ SpeciesId.MAREANIE ], 38: [ SpeciesId.TOXAPEX ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.TOTODILE ], 18: [ SpeciesId.CROCONAW ], 30: [ SpeciesId.FERALIGATR ]}, { 1: [ SpeciesId.MUDKIP ], 16: [ SpeciesId.MARSHTOMP ], 36: [ SpeciesId.SWAMPERT ]}]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.GALAR_SLOWPOKE ], 40: [ SpeciesId.GALAR_SLOWBRO ]}, { 1: [ SpeciesId.HISUI_SLIGGOO ], 80: [ SpeciesId.HISUI_GOODRA ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.GALAR_SLOWPOKE ], 40: [ SpeciesId.GALAR_SLOWBRO ]}, { 1: [ SpeciesId.HISUI_SLIGGOO ], 80: [ SpeciesId.HISUI_GOODRA ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.POLITOED, SpeciesId.GALAR_STUNFISK ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, SpeciesId.POIPOLE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.QUAGSIRE, SpeciesId.LUDICOLO ],
      [TimeOfDay.DAY]: [ SpeciesId.QUAGSIRE, SpeciesId.LUDICOLO ],
      [TimeOfDay.DUSK]: [ SpeciesId.ARBOK, SpeciesId.CLODSIRE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ARBOK, SpeciesId.CLODSIRE ],
      [TimeOfDay.ALL]: [ SpeciesId.POLIWRATH, SpeciesId.SWALOT, SpeciesId.WHISCASH, SpeciesId.GASTRODON, SpeciesId.SEISMITOAD, SpeciesId.STUNFISK, SpeciesId.TOXAPEX ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING, SpeciesId.HISUI_GOODRA ],
      [TimeOfDay.DAY]: [ SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING, SpeciesId.HISUI_GOODRA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.FERALIGATR, SpeciesId.POLITOED, SpeciesId.SWAMPERT, SpeciesId.GALAR_STUNFISK ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, SpeciesId.NAGANADEL ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ]}],
      [TimeOfDay.DUSK]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.KRABBY ], 28: [ SpeciesId.KINGLER ]},
        { 1: [ SpeciesId.CORPHISH ], 30: [ SpeciesId.CRAWDAUNT ]},
        { 1: [ SpeciesId.DWEBBLE ], 34: [ SpeciesId.CRUSTLE ]},
        { 1: [ SpeciesId.BINACLE ], 39: [ SpeciesId.BARBARACLE ]},
        { 1: [ SpeciesId.MAREANIE ], 38: [ SpeciesId.TOXAPEX ]},
        { 1: [ SpeciesId.WIGLETT ], 26: [ SpeciesId.WUGTRIO ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ]}, { 1: [ SpeciesId.CLAUNCHER ], 37: [ SpeciesId.CLAWITZER ]}, { 1: [ SpeciesId.SANDYGAST ], 42: [ SpeciesId.PALOSSAND ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.QUAXLY ], 16: [ SpeciesId.QUAXWELL ], 36: [ SpeciesId.QUAQUAVAL ]}, SpeciesId.TATSUGIRI ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.TIRTOUGA ], 37: [ SpeciesId.CARRACOSTA ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRESSELIA, SpeciesId.KELDEO, SpeciesId.TAPU_FINI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.STARMIE ],
      [TimeOfDay.DAY]: [ SpeciesId.STARMIE ],
      [TimeOfDay.DUSK]: [ SpeciesId.CLOYSTER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CLOYSTER ],
      [TimeOfDay.ALL]: [ SpeciesId.KINGLER, SpeciesId.CRAWDAUNT, SpeciesId.WORMADAM, SpeciesId.CRUSTLE, SpeciesId.BARBARACLE, SpeciesId.CLAWITZER, SpeciesId.TOXAPEX, SpeciesId.PALOSSAND ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CARRACOSTA, SpeciesId.QUAQUAVAL ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRESSELIA, SpeciesId.KELDEO, SpeciesId.TAPU_FINI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ]}, { 1: [ SpeciesId.DUCKLETT ], 35: [ SpeciesId.SWANNA ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ]}, { 1: [ SpeciesId.DUCKLETT ], 35: [ SpeciesId.SWANNA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PSYDUCK ], 33: [ SpeciesId.GOLDUCK ]},
        { 1: [ SpeciesId.GOLDEEN ], 33: [ SpeciesId.SEAKING ]},
        { 1: [ SpeciesId.MAGIKARP ], 20: [ SpeciesId.GYARADOS ]},
        { 1: [ SpeciesId.CHEWTLE ], 22: [ SpeciesId.DREDNAW ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.DEWPIDER ], 22: [ SpeciesId.ARAQUANID ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.DEWPIDER ], 22: [ SpeciesId.ARAQUANID ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ]}, { 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ]}, { 1: [ SpeciesId.SURSKIT ], 22: [ SpeciesId.MASQUERAIN ]}, SpeciesId.WISHIWASHI, SpeciesId.FLAMIGO ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SQUIRTLE ], 16: [ SpeciesId.WARTORTLE ], 36: [ SpeciesId.BLASTOISE ]},
        { 1: [ SpeciesId.OSHAWOTT ], 17: [ SpeciesId.DEWOTT ], 36: [ SpeciesId.SAMUROTT ]},
        { 1: [ SpeciesId.FROAKIE ], 16: [ SpeciesId.FROGADIER ], 36: [ SpeciesId.GRENINJA ]},
        { 1: [ SpeciesId.SOBBLE ], 16: [ SpeciesId.DRIZZILE ], 35: [ SpeciesId.INTELEON ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VAPOREON, SpeciesId.SLOWKING ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUICUNE, SpeciesId.MESPRIT ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SWANNA, SpeciesId.ARAQUANID ],
      [TimeOfDay.DAY]: [ SpeciesId.SWANNA, SpeciesId.ARAQUANID ],
      [TimeOfDay.DUSK]: [ SpeciesId.AZUMARILL ],
      [TimeOfDay.NIGHT]: [ SpeciesId.AZUMARILL ],
      [TimeOfDay.ALL]: [ SpeciesId.GOLDUCK, SpeciesId.SLOWBRO, SpeciesId.SEAKING, SpeciesId.GYARADOS, SpeciesId.MASQUERAIN, SpeciesId.WISHIWASHI, SpeciesId.DREDNAW ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLASTOISE, SpeciesId.VAPOREON, SpeciesId.SLOWKING, SpeciesId.SAMUROTT, SpeciesId.GRENINJA, SpeciesId.INTELEON ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUICUNE, SpeciesId.MESPRIT ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CHINCHOU ], 27: [ SpeciesId.LANTURN ]},
        SpeciesId.REMORAID,
        SpeciesId.CLAMPERL,
        SpeciesId.BASCULIN,
        { 1: [ SpeciesId.FRILLISH ], 40: [ SpeciesId.JELLICENT ]},
        { 1: [ SpeciesId.ARROKUDA ], 26: [ SpeciesId.BARRASKEWDA ]},
        SpeciesId.VELUZA
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.TENTACOOL ], 30: [ SpeciesId.TENTACRUEL ]},
        SpeciesId.SHELLDER,
        { 1: [ SpeciesId.WAILMER ], 40: [ SpeciesId.WAILORD ]},
        SpeciesId.LUVDISC,
        { 1: [ SpeciesId.SHELLOS ], 30: [ SpeciesId.GASTRODON ]},
        { 1: [ SpeciesId.SKRELP ], 48: [ SpeciesId.DRAGALGE ]},
        SpeciesId.PINCURCHIN,
        SpeciesId.DONDOZO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.QWILFISH, SpeciesId.CORSOLA, SpeciesId.OCTILLERY, { 1: [ SpeciesId.MANTYKE ], 52: [ SpeciesId.MANTINE ]}, SpeciesId.ALOMOMOLA, { 1: [ SpeciesId.TYNAMO ], 39: [ SpeciesId.EELEKTRIK ]}, SpeciesId.DHELMISE ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.OMANYTE ], 40: [ SpeciesId.OMASTAR ]},
        { 1: [ SpeciesId.KABUTO ], 40: [ SpeciesId.KABUTOPS ]},
        SpeciesId.RELICANTH,
        SpeciesId.PYUKUMUKU,
        { 1: [ SpeciesId.GALAR_CORSOLA ], 38: [ SpeciesId.CURSOLA ]},
        SpeciesId.ARCTOVISH,
        SpeciesId.HISUI_QWILFISH
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FEEBAS, SpeciesId.NIHILEGO ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.LANTURN, SpeciesId.QWILFISH, SpeciesId.CORSOLA, SpeciesId.OCTILLERY, SpeciesId.MANTINE, SpeciesId.WAILORD, SpeciesId.HUNTAIL, SpeciesId.GOREBYSS, SpeciesId.LUVDISC, SpeciesId.JELLICENT, SpeciesId.ALOMOMOLA, SpeciesId.DRAGALGE, SpeciesId.BARRASKEWDA, SpeciesId.DONDOZO ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.OMASTAR, SpeciesId.KABUTOPS, SpeciesId.RELICANTH, SpeciesId.EELEKTROSS, SpeciesId.PYUKUMUKU, SpeciesId.DHELMISE, SpeciesId.CURSOLA, SpeciesId.ARCTOVISH, SpeciesId.BASCULEGION, SpeciesId.OVERQWIL ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MILOTIC, SpeciesId.NIHILEGO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KYOGRE ]}
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.TAILLOW ], 22: [ SpeciesId.SWELLOW ]},
        { 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ]},
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ]},
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ]},
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.TAILLOW ], 22: [ SpeciesId.SWELLOW ]},
        { 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ]},
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ]},
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ]},
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]}, { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ]}, { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]}, { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ]}, { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.PIDGEY ], 18: [ SpeciesId.PIDGEOTTO ], 36: [ SpeciesId.PIDGEOT ]}, { 1: [ SpeciesId.SPEAROW ], 20: [ SpeciesId.FEAROW ]}, { 1: [ SpeciesId.SKIDDO ], 32: [ SpeciesId.GOGOAT ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]},
        { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ]},
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]},
        { 1: [ SpeciesId.RUFFLET ], 54: [ SpeciesId.BRAVIARY ]},
        { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ]},
        { 1: [ SpeciesId.FLITTLE ], 35: [ SpeciesId.ESPATHRA ]},
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]},
        { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ]},
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]},
        { 1: [ SpeciesId.RUFFLET ], 54: [ SpeciesId.BRAVIARY ]},
        { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ]},
        { 1: [ SpeciesId.FLITTLE ], 35: [ SpeciesId.ESPATHRA ]},
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.VULLABY ], 54: [ SpeciesId.MANDIBUZZ ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.VULLABY ], 54: [ SpeciesId.MANDIBUZZ ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ]},
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ]},
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ]},
        { 1: [ SpeciesId.SLUGMA ], 38: [ SpeciesId.MAGCARGO ]},
        { 1: [ SpeciesId.NACLI ], 24: [ SpeciesId.NACLSTACK ], 38: [ SpeciesId.GARGANACL ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.MURKROW ],
      [TimeOfDay.ALL]: [ SpeciesId.SKARMORY, { 1: [ SpeciesId.TORCHIC ], 16: [ SpeciesId.COMBUSKEN ], 36: [ SpeciesId.BLAZIKEN ]}, { 1: [ SpeciesId.SPOINK ], 32: [ SpeciesId.GRUMPIG ]}, SpeciesId.HAWLUCHA, SpeciesId.KLAWF ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ]},
        { 1: [ SpeciesId.CRANIDOS ], 30: [ SpeciesId.RAMPARDOS ]},
        { 1: [ SpeciesId.SHIELDON ], 30: [ SpeciesId.BASTIODON ]},
        { 1: [ SpeciesId.GIBLE ], 24: [ SpeciesId.GABITE ], 48: [ SpeciesId.GARCHOMP ]},
        SpeciesId.ROTOM,
        SpeciesId.ARCHEOPS,
        { 1: [ SpeciesId.AXEW ], 38: [ SpeciesId.FRAXURE ]}
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SWELLOW, SpeciesId.ALTARIA, SpeciesId.STARAPTOR, SpeciesId.UNFEZANT, SpeciesId.BRAVIARY, SpeciesId.TALONFLAME, SpeciesId.CORVIKNIGHT, SpeciesId.ESPATHRA ],
      [TimeOfDay.DAY]: [ SpeciesId.SWELLOW, SpeciesId.ALTARIA, SpeciesId.STARAPTOR, SpeciesId.UNFEZANT, SpeciesId.BRAVIARY, SpeciesId.TALONFLAME, SpeciesId.CORVIKNIGHT, SpeciesId.ESPATHRA ],
      [TimeOfDay.DUSK]: [ SpeciesId.MANDIBUZZ ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MANDIBUZZ ],
      [TimeOfDay.ALL]: [ SpeciesId.PIDGEOT, SpeciesId.FEAROW, SpeciesId.SKARMORY, SpeciesId.AGGRON, SpeciesId.GOGOAT, SpeciesId.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.HISUI_BRAVIARY ], [TimeOfDay.DAY]: [ SpeciesId.HISUI_BRAVIARY ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLAZIKEN, SpeciesId.RAMPARDOS, SpeciesId.BASTIODON, SpeciesId.HAWLUCHA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM, SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HO_OH ]}
  },
  [Biome.BADLANDS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.PHANPY ], 25: [ SpeciesId.DONPHAN ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.PHANPY ], 25: [ SpeciesId.DONPHAN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.DIGLETT ], 26: [ SpeciesId.DUGTRIO ]},
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ]},
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]},
        { 1: [ SpeciesId.DRILBUR ], 31: [ SpeciesId.EXCADRILL ]},
        { 1: [ SpeciesId.MUDBRAY ], 30: [ SpeciesId.MUDSDALE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.SIZZLIPEDE ], 28: [ SpeciesId.CENTISKORCH ]}, { 1: [ SpeciesId.CAPSAKID ], 30: [ SpeciesId.SCOVILLAIN ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.SIZZLIPEDE ], 28: [ SpeciesId.CENTISKORCH ]}, { 1: [ SpeciesId.CAPSAKID ], 30: [ SpeciesId.SCOVILLAIN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SANDSHREW ], 22: [ SpeciesId.SANDSLASH ]},
        { 1: [ SpeciesId.NUMEL ], 33: [ SpeciesId.CAMERUPT ]},
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]},
        { 1: [ SpeciesId.CUFANT ], 34: [ SpeciesId.COPPERAJAH ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.GLIGAR, { 1: [ SpeciesId.POLTCHAGEIST ], 30: [ SpeciesId.SINISTCHA ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LANDORUS, SpeciesId.OKIDOGI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN ],
      [TimeOfDay.DAY]: [ SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.DUGTRIO, SpeciesId.GOLEM, SpeciesId.RHYPERIOR, SpeciesId.GLISCOR, SpeciesId.EXCADRILL, SpeciesId.MUDSDALE, SpeciesId.COPPERAJAH ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.STEELIX, SpeciesId.SINISTCHA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LANDORUS, SpeciesId.OKIDOGI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GROUDON ]}
  },
  [Biome.CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.ZUBAT ], 22: [ SpeciesId.GOLBAT ]},
        { 1: [ SpeciesId.PARAS ], 24: [ SpeciesId.PARASECT ]},
        { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]},
        { 1: [ SpeciesId.WHISMUR ], 20: [ SpeciesId.LOUDRED ], 40: [ SpeciesId.EXPLOUD ]},
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ]},
        { 1: [ SpeciesId.WOOBAT ], 20: [ SpeciesId.SWOOBAT ]},
        { 1: [ SpeciesId.BUNNELBY ], 20: [ SpeciesId.DIGGERSBY ]},
        { 1: [ SpeciesId.NACLI ], 24: [ SpeciesId.NACLSTACK ], 38: [ SpeciesId.GARGANACL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ]}],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ]},
        { 1: [ SpeciesId.MAKUHITA ], 24: [ SpeciesId.HARIYAMA ]},
        SpeciesId.NOSEPASS,
        { 1: [ SpeciesId.NOIBAT ], 48: [ SpeciesId.NOIVERN ]},
        { 1: [ SpeciesId.WIMPOD ], 30: [ SpeciesId.GOLISOPOD ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ONIX, { 1: [ SpeciesId.FERROSEED ], 40: [ SpeciesId.FERROTHORN ]}, SpeciesId.CARBINK, { 1: [ SpeciesId.GLIMMET ], 35: [ SpeciesId.GLIMMORA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHUCKLE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UXIE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.PARASECT, SpeciesId.ONIX, SpeciesId.CROBAT, SpeciesId.URSARING, SpeciesId.EXPLOUD, SpeciesId.PROBOPASS, SpeciesId.GIGALITH, SpeciesId.SWOOBAT, SpeciesId.DIGGERSBY, SpeciesId.NOIVERN, SpeciesId.GOLISOPOD, SpeciesId.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.LYCANROC ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHUCKLE, SpeciesId.FERROTHORN, SpeciesId.GLIMMORA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UXIE ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERAPAGOS ]}
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.TRAPINCH, { 1: [ SpeciesId.HIPPOPOTAS ], 34: [ SpeciesId.HIPPOWDON ]}, { 1: [ SpeciesId.RELLOR ], 29: [ SpeciesId.RABSCA ]}],
      [TimeOfDay.DAY]: [ SpeciesId.TRAPINCH, { 1: [ SpeciesId.HIPPOPOTAS ], 34: [ SpeciesId.HIPPOWDON ]}, { 1: [ SpeciesId.RELLOR ], 29: [ SpeciesId.RABSCA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.CACNEA ], 32: [ SpeciesId.CACTURNE ]}, { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.CACNEA ], 32: [ SpeciesId.CACTURNE ]}, { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.SANDSHREW ], 22: [ SpeciesId.SANDSLASH ]}, { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ]}, { 1: [ SpeciesId.SILICOBRA ], 36: [ SpeciesId.SANDACONDA ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ]}, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ]}, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.MARACTUS, { 1: [ SpeciesId.BRAMBLIN ], 30: [ SpeciesId.BRAMBLEGHAST ]}, SpeciesId.ORTHWORM ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.DARUMAKA ], 35: [ SpeciesId.DARMANITAN ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.LILEEP ], 40: [ SpeciesId.CRADILY ]}, { 1: [ SpeciesId.ANORITH ], 40: [ SpeciesId.ARMALDO ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIROCK, SpeciesId.TAPU_BULU, SpeciesId.PHEROMOSA ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.HIPPOWDON, SpeciesId.HELIOLISK, SpeciesId.RABSCA ],
      [TimeOfDay.DAY]: [ SpeciesId.HIPPOWDON, SpeciesId.HELIOLISK, SpeciesId.RABSCA ],
      [TimeOfDay.DUSK]: [ SpeciesId.CACTURNE, SpeciesId.KROOKODILE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CACTURNE, SpeciesId.KROOKODILE ],
      [TimeOfDay.ALL]: [ SpeciesId.SANDSLASH, SpeciesId.DRAPION, SpeciesId.DARMANITAN, SpeciesId.MARACTUS, SpeciesId.SANDACONDA, SpeciesId.BRAMBLEGHAST ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRADILY, SpeciesId.ARMALDO ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIROCK, SpeciesId.TAPU_BULU, SpeciesId.PHEROMOSA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SEEL ], 34: [ SpeciesId.DEWGONG ]},
        { 1: [ SpeciesId.SWINUB ], 33: [ SpeciesId.PILOSWINE ]},
        { 1: [ SpeciesId.SNOVER ], 40: [ SpeciesId.ABOMASNOW ]},
        { 1: [ SpeciesId.VANILLITE ], 35: [ SpeciesId.VANILLISH ], 47: [ SpeciesId.VANILLUXE ]},
        { 1: [ SpeciesId.CUBCHOO ], 37: [ SpeciesId.BEARTIC ]},
        { 1: [ SpeciesId.BERGMITE ], 37: [ SpeciesId.AVALUGG ]},
        SpeciesId.CRABRAWLER,
        { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.SNEASEL,
        { 1: [ SpeciesId.SNORUNT ], 42: [ SpeciesId.GLALIE ]},
        { 1: [ SpeciesId.SPHEAL ], 32: [ SpeciesId.SEALEO ], 44: [ SpeciesId.WALREIN ]},
        SpeciesId.EISCUE,
        { 1: [ SpeciesId.CETODDLE ], 30: [ SpeciesId.CETITAN ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.FROSLASS, SpeciesId.CRYOGONAL ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, SpeciesId.ROTOM, { 1: [ SpeciesId.AMAURA ], 59: [ SpeciesId.AURORUS ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARTICUNO, SpeciesId.REGICE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DEWGONG, SpeciesId.GLALIE, SpeciesId.WALREIN, SpeciesId.WEAVILE, SpeciesId.MAMOSWINE, SpeciesId.FROSLASS, SpeciesId.VANILLUXE, SpeciesId.BEARTIC, SpeciesId.CRYOGONAL, SpeciesId.AVALUGG, SpeciesId.CRABOMINABLE, SpeciesId.CETITAN ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.GLACEON, SpeciesId.AURORUS ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARTICUNO, SpeciesId.REGICE, SpeciesId.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KYUREM ]}
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.LEDYBA ], 18: [ SpeciesId.LEDIAN ]}, SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.BLITZLE ], 27: [ SpeciesId.ZEBSTRIKA ]},
        { 1: [ SpeciesId.FLABEBE ], 19: [ SpeciesId.FLOETTE ]},
        { 1: [ SpeciesId.CUTIEFLY ], 25: [ SpeciesId.RIBOMBEE ]},
        { 1: [ SpeciesId.GOSSIFLEUR ], 20: [ SpeciesId.ELDEGOSS ]},
        { 1: [ SpeciesId.WOOLOO ], 24: [ SpeciesId.DUBWOOL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ]},
        { 1: [ SpeciesId.SNUBBULL ], 23: [ SpeciesId.GRANBULL ]},
        { 1: [ SpeciesId.SKITTY ], 30: [ SpeciesId.DELCATTY ]},
        SpeciesId.BOUFFALANT,
        { 1: [ SpeciesId.SMOLIV ], 25: [ SpeciesId.DOLLIV ], 35: [ SpeciesId.ARBOLIVA ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ]},
        { 1: [ SpeciesId.SNUBBULL ], 23: [ SpeciesId.GRANBULL ]},
        { 1: [ SpeciesId.SKITTY ], 30: [ SpeciesId.DELCATTY ]},
        SpeciesId.BOUFFALANT,
        { 1: [ SpeciesId.SMOLIV ], 25: [ SpeciesId.DOLLIV ], 35: [ SpeciesId.ARBOLIVA ]}
      ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.JIGGLYPUFF ], 30: [ SpeciesId.WIGGLYTUFF ]},
        { 1: [ SpeciesId.MAREEP ], 15: [ SpeciesId.FLAAFFY ], 30: [ SpeciesId.AMPHAROS ]},
        { 1: [ SpeciesId.RALTS ], 20: [ SpeciesId.KIRLIA ], 30: [ SpeciesId.GARDEVOIR ]},
        { 1: [ SpeciesId.GLAMEOW ], 38: [ SpeciesId.PURUGLY ]},
        SpeciesId.ORICORIO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.VOLBEAT, SpeciesId.ILLUMISE ],
      [TimeOfDay.ALL]: [ SpeciesId.TAUROS, SpeciesId.EEVEE, SpeciesId.MILTANK, SpeciesId.SPINDA, { 1: [ SpeciesId.APPLIN ], 30: [ SpeciesId.DIPPLIN ]}, { 1: [ SpeciesId.SPRIGATITO ], 16: [ SpeciesId.FLORAGATO ], 36: [ SpeciesId.MEOWSCARADA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CHANSEY, SpeciesId.SYLVEON ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MELOETTA ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.LEDIAN, SpeciesId.GRANBULL, SpeciesId.DELCATTY, SpeciesId.ROSERADE, SpeciesId.CINCCINO, SpeciesId.BOUFFALANT, SpeciesId.ARBOLIVA ],
      [TimeOfDay.DAY]: [ SpeciesId.GRANBULL, SpeciesId.DELCATTY, SpeciesId.ROSERADE, SpeciesId.CINCCINO, SpeciesId.BOUFFALANT, SpeciesId.ARBOLIVA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.TAUROS, SpeciesId.MILTANK, SpeciesId.GARDEVOIR, SpeciesId.PURUGLY, SpeciesId.ZEBSTRIKA, SpeciesId.FLORGES, SpeciesId.RIBOMBEE, SpeciesId.DUBWOOL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.HISUI_LILLIGANT ], [TimeOfDay.DAY]: [ SpeciesId.HISUI_LILLIGANT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLISSEY, SpeciesId.SYLVEON, SpeciesId.FLAPPLE, SpeciesId.APPLETUN, SpeciesId.MEOWSCARADA, SpeciesId.HYDRAPPLE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MELOETTA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHAYMIN ]}
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.PIKACHU,
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ]},
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ]},
        { 1: [ SpeciesId.ELECTRIKE ], 26: [ SpeciesId.MANECTRIC ]},
        { 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ]},
        SpeciesId.DEDENNE,
        { 1: [ SpeciesId.GRUBBIN ], 20: [ SpeciesId.CHARJABUG ]},
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ]},
        { 1: [ SpeciesId.TADBULB ], 30: [ SpeciesId.BELLIBOLT ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ELECTABUZZ, SpeciesId.PLUSLE, SpeciesId.MINUN, SpeciesId.PACHIRISU, SpeciesId.EMOLGA, SpeciesId.TOGEDEMARU ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.MAREEP ], 15: [ SpeciesId.FLAAFFY ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JOLTEON, SpeciesId.HISUI_VOLTORB ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.RAIKOU, SpeciesId.THUNDURUS, SpeciesId.XURKITREE, SpeciesId.ZERAORA, SpeciesId.REGIELEKI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.RAICHU, SpeciesId.MANECTRIC, SpeciesId.LUXRAY, SpeciesId.MAGNEZONE, SpeciesId.ELECTIVIRE, SpeciesId.DEDENNE, SpeciesId.VIKAVOLT, SpeciesId.TOGEDEMARU, SpeciesId.PAWMOT, SpeciesId.BELLIBOLT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JOLTEON, SpeciesId.AMPHAROS, SpeciesId.HISUI_ELECTRODE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZAPDOS, SpeciesId.RAIKOU, SpeciesId.THUNDURUS, SpeciesId.XURKITREE, SpeciesId.ZERAORA, SpeciesId.REGIELEKI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZEKROM ]}
  },
  [Biome.VOLCANO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.VULPIX,
        SpeciesId.GROWLITHE,
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ]},
        { 1: [ SpeciesId.SLUGMA ], 38: [ SpeciesId.MAGCARGO ]},
        { 1: [ SpeciesId.NUMEL ], 33: [ SpeciesId.CAMERUPT ]},
        { 1: [ SpeciesId.SALANDIT ], 33: [ SpeciesId.SALAZZLE ]},
        { 1: [ SpeciesId.ROLYCOLY ], 18: [ SpeciesId.CARKOL ], 34: [ SpeciesId.COALOSSAL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MAGMAR, SpeciesId.TORKOAL, { 1: [ SpeciesId.PANSEAR ], 30: [ SpeciesId.SIMISEAR ]}, SpeciesId.HEATMOR, SpeciesId.TURTONATOR ]},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CHARMANDER ], 16: [ SpeciesId.CHARMELEON ], 36: [ SpeciesId.CHARIZARD ]},
        { 1: [ SpeciesId.CYNDAQUIL ], 14: [ SpeciesId.QUILAVA ], 36: [ SpeciesId.TYPHLOSION ]},
        { 1: [ SpeciesId.CHIMCHAR ], 14: [ SpeciesId.MONFERNO ], 36: [ SpeciesId.INFERNAPE ]},
        { 1: [ SpeciesId.TEPIG ], 17: [ SpeciesId.PIGNITE ], 36: [ SpeciesId.EMBOAR ]},
        { 1: [ SpeciesId.FENNEKIN ], 16: [ SpeciesId.BRAIXEN ], 36: [ SpeciesId.DELPHOX ]},
        { 1: [ SpeciesId.LITTEN ], 17: [ SpeciesId.TORRACAT ], 34: [ SpeciesId.INCINEROAR ]},
        { 1: [ SpeciesId.SCORBUNNY ], 16: [ SpeciesId.RABOOT ], 35: [ SpeciesId.CINDERACE ]},
        { 1: [ SpeciesId.CHARCADET ], 30: [ SpeciesId.ARMAROUGE ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FLAREON, SpeciesId.ROTOM, { 1: [ SpeciesId.LARVESTA ], 59: [ SpeciesId.VOLCARONA ]}, SpeciesId.HISUI_GROWLITHE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ENTEI, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.NINETALES, SpeciesId.ARCANINE, SpeciesId.RAPIDASH, SpeciesId.MAGCARGO, SpeciesId.CAMERUPT, SpeciesId.TORKOAL, SpeciesId.MAGMORTAR, SpeciesId.SIMISEAR, SpeciesId.HEATMOR, SpeciesId.SALAZZLE, SpeciesId.TURTONATOR, SpeciesId.COALOSSAL ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.CHARIZARD, SpeciesId.FLAREON, SpeciesId.TYPHLOSION, SpeciesId.INFERNAPE, SpeciesId.EMBOAR, SpeciesId.VOLCARONA, SpeciesId.DELPHOX, SpeciesId.INCINEROAR, SpeciesId.CINDERACE, SpeciesId.ARMAROUGE, SpeciesId.HISUI_ARCANINE ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MOLTRES, SpeciesId.ENTEI, SpeciesId.ROTOM, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.RESHIRAM ]}
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GASTLY ], 25: [ SpeciesId.HAUNTER ]},
        { 1: [ SpeciesId.SHUPPET ], 37: [ SpeciesId.BANETTE ]},
        { 1: [ SpeciesId.DUSKULL ], 37: [ SpeciesId.DUSCLOPS ]},
        { 1: [ SpeciesId.DRIFLOON ], 28: [ SpeciesId.DRIFBLIM ]},
        { 1: [ SpeciesId.LITWICK ], 41: [ SpeciesId.LAMPENT ]},
        SpeciesId.PHANTUMP,
        SpeciesId.PUMPKABOO,
        { 1: [ SpeciesId.GREAVARD ], 60: [ SpeciesId.HOUNDSTONE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ]}, { 1: [ SpeciesId.YAMASK ], 34: [ SpeciesId.COFAGRIGUS ]}, { 1: [ SpeciesId.SINISTEA ], 30: [ SpeciesId.POLTEAGEIST ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MISDREAVUS, SpeciesId.MIMIKYU, { 1: [ SpeciesId.FUECOCO ], 16: [ SpeciesId.CROCALOR ], 36: [ SpeciesId.SKELEDIRGE ]}, SpeciesId.CERULEDGE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SPIRITOMB ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MARSHADOW, SpeciesId.SPECTRIER ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.DAY]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.DUSK]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.GENGAR, SpeciesId.BANETTE, SpeciesId.DRIFBLIM, SpeciesId.MISMAGIUS, SpeciesId.DUSKNOIR, SpeciesId.CHANDELURE, SpeciesId.TREVENANT, SpeciesId.GOURGEIST, SpeciesId.MIMIKYU, SpeciesId.POLTEAGEIST, SpeciesId.HOUNDSTONE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SKELEDIRGE, SpeciesId.CERULEDGE, SpeciesId.HISUI_TYPHLOSION ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MARSHADOW, SpeciesId.SPECTRIER ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GIRATINA ]}
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ]},
        { 1: [ SpeciesId.MAKUHITA ], 24: [ SpeciesId.HARIYAMA ]},
        { 1: [ SpeciesId.MEDITITE ], 37: [ SpeciesId.MEDICHAM ]},
        { 1: [ SpeciesId.STUFFUL ], 27: [ SpeciesId.BEWEAR ]},
        { 1: [ SpeciesId.CLOBBOPUS ], 55: [ SpeciesId.GRAPPLOCT ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ]}, { 1: [ SpeciesId.SCRAGGY ], 39: [ SpeciesId.SCRAFTY ]}, { 1: [ SpeciesId.MIENFOO ], 50: [ SpeciesId.MIENSHAO ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.LUCARIO, SpeciesId.THROH, SpeciesId.SAWK, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.GALAR_FARFETCHD ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, SpeciesId.KUBFU, SpeciesId.GALAR_ZAPDOS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.HARIYAMA, SpeciesId.MEDICHAM, SpeciesId.LUCARIO, SpeciesId.TOXICROAK, SpeciesId.THROH, SpeciesId.SAWK, SpeciesId.SCRAFTY, SpeciesId.MIENSHAO, SpeciesId.BEWEAR, SpeciesId.GRAPPLOCT, SpeciesId.ANNIHILAPE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.PANGORO, SpeciesId.SIRFETCHD, SpeciesId.HISUI_DECIDUEYE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, SpeciesId.URSHIFU ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZAMAZENTA, SpeciesId.GALAR_ZAPDOS ]}
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ]},
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ]},
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ]},
        { 1: [ SpeciesId.TIMBURR ], 25: [ SpeciesId.GURDURR ]},
        { 1: [ SpeciesId.KLINK ], 38: [ SpeciesId.KLANG ], 49: [ SpeciesId.KLINKLANG ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ]}, SpeciesId.KLEFKI ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BELDUM ], 20: [ SpeciesId.METANG ], 45: [ SpeciesId.METAGROSS ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GENESECT, SpeciesId.MAGEARNA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KLINKLANG, SpeciesId.KLEFKI ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GENESECT, SpeciesId.MAGEARNA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.RUINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.DROWZEE ], 26: [ SpeciesId.HYPNO ]},
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ]},
        SpeciesId.UNOWN,
        { 1: [ SpeciesId.SPOINK ], 32: [ SpeciesId.GRUMPIG ]},
        { 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ]},
        { 1: [ SpeciesId.ELGYEM ], 42: [ SpeciesId.BEHEEYEM ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.ABRA ], 16: [ SpeciesId.KADABRA ]}, SpeciesId.SIGILYPH, { 1: [ SpeciesId.TINKATINK ], 24: [ SpeciesId.TINKATUFF ], 38: [ SpeciesId.TINKATON ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, { 1: [ SpeciesId.GOTHITA ], 32: [ SpeciesId.GOTHORITA ], 41: [ SpeciesId.GOTHITELLE ]}, SpeciesId.STONJOURNER ]},
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ SpeciesId.ESPEON ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.GALAR_YAMASK ], 34: [ SpeciesId.RUNERIGUS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.GALAR_YAMASK ], 34: [ SpeciesId.RUNERIGUS ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.ARCHEN ], 37: [ SpeciesId.ARCHEOPS ]}]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ALAKAZAM, SpeciesId.HYPNO, SpeciesId.XATU, SpeciesId.GRUMPIG, SpeciesId.CLAYDOL, SpeciesId.SIGILYPH, SpeciesId.GOTHITELLE, SpeciesId.BEHEEYEM, SpeciesId.TINKATON ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.ESPEON ], [TimeOfDay.DUSK]: [ SpeciesId.RUNERIGUS ], [TimeOfDay.NIGHT]: [ SpeciesId.RUNERIGUS ], [TimeOfDay.ALL]: [ SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, SpeciesId.ARCHEOPS ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KORAIDON ]}
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.BAGON ], 30: [ SpeciesId.SHELGON ], 50: [ SpeciesId.SALAMENCE ]},
        { 1: [ SpeciesId.GOOMY ], 40: [ SpeciesId.SLIGGOO ], 80: [ SpeciesId.GOODRA ]},
        { 1: [ SpeciesId.JANGMO_O ], 35: [ SpeciesId.HAKAMO_O ], 45: [ SpeciesId.KOMMO_O ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.BAGON ], 30: [ SpeciesId.SHELGON ], 50: [ SpeciesId.SALAMENCE ]},
        { 1: [ SpeciesId.GOOMY ], 40: [ SpeciesId.SLIGGOO ], 80: [ SpeciesId.GOODRA ]},
        { 1: [ SpeciesId.JANGMO_O ], 35: [ SpeciesId.HAKAMO_O ], 45: [ SpeciesId.KOMMO_O ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ], 55: [ SpeciesId.TYRANITAR ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ], 55: [ SpeciesId.TYRANITAR ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ]},
        { 1: [ SpeciesId.GIBLE ], 24: [ SpeciesId.GABITE ], 48: [ SpeciesId.GARCHOMP ]},
        { 1: [ SpeciesId.AXEW ], 38: [ SpeciesId.FRAXURE ], 48: [ SpeciesId.HAXORUS ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ]}, SpeciesId.DRAMPA, SpeciesId.CYCLIZAR ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.DREEPY ], 50: [ SpeciesId.DRAKLOAK ], 60: [ SpeciesId.DRAGAPULT ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.DREEPY ], 50: [ SpeciesId.DRAKLOAK ], 60: [ SpeciesId.DRAGAPULT ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.DRATINI ], 30: [ SpeciesId.DRAGONAIR ], 55: [ SpeciesId.DRAGONITE ]}, { 1: [ SpeciesId.FRIGIBAX ], 35: [ SpeciesId.ARCTIBAX ], 54: [ SpeciesId.BAXCALIBUR ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AERODACTYL, SpeciesId.DRUDDIGON, { 1: [ SpeciesId.TYRUNT ], 59: [ SpeciesId.TYRANTRUM ]}, SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIDRAGO ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O ],
      [TimeOfDay.DAY]: [ SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O ],
      [TimeOfDay.DUSK]: [ SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT ],
      [TimeOfDay.ALL]: [ SpeciesId.DRAGONITE, SpeciesId.FLYGON, SpeciesId.GARCHOMP, SpeciesId.HAXORUS, SpeciesId.DRAMPA, SpeciesId.BAXCALIBUR ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AERODACTYL, SpeciesId.DRUDDIGON, SpeciesId.TYRANTRUM, SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIDRAGO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIALGA ]}
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.MURKROW,
        { 1: [ SpeciesId.HOUNDOUR ], 24: [ SpeciesId.HOUNDOOM ]},
        SpeciesId.SABLEYE,
        { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ]},
        { 1: [ SpeciesId.PAWNIARD ], 52: [ SpeciesId.BISHARP ], 64: [ SpeciesId.KINGAMBIT ]},
        { 1: [ SpeciesId.NICKIT ], 18: [ SpeciesId.THIEVUL ]},
        { 1: [ SpeciesId.IMPIDIMP ], 32: [ SpeciesId.MORGREM ], 42: [ SpeciesId.GRIMMSNARL ]},
        { 1: [ SpeciesId.MASCHIFF ], 30: [ SpeciesId.MABOSSTIFF ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ABSOL, SpeciesId.SPIRITOMB, { 1: [ SpeciesId.ZORUA ], 30: [ SpeciesId.ZOROARK ]}, { 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UMBREON ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DARKRAI, SpeciesId.GALAR_MOLTRES ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.HOUNDOOM, SpeciesId.SABLEYE, SpeciesId.ABSOL, SpeciesId.HONCHKROW, SpeciesId.SPIRITOMB, SpeciesId.LIEPARD, SpeciesId.ZOROARK, SpeciesId.HYDREIGON, SpeciesId.THIEVUL, SpeciesId.GRIMMSNARL, SpeciesId.MABOSSTIFF, SpeciesId.KINGAMBIT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UMBREON, SpeciesId.HISUI_SAMUROTT ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DARKRAI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PALKIA, SpeciesId.YVELTAL, SpeciesId.GALAR_MOLTRES ]}
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ SpeciesId.SOLROCK ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.LUNATONE ],
      [TimeOfDay.ALL]: [ SpeciesId.CLEFAIRY, { 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ]}, { 1: [ SpeciesId.MUNNA ], 30: [ SpeciesId.MUSHARNA ]}, SpeciesId.MINIOR ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ]}, { 1: [ SpeciesId.ELGYEM ], 42: [ SpeciesId.BEHEEYEM ]}]},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BELDUM ], 20: [ SpeciesId.METANG ], 45: [ SpeciesId.METAGROSS ]}, SpeciesId.SIGILYPH, { 1: [ SpeciesId.SOLOSIS ], 32: [ SpeciesId.DUOSION ], 41: [ SpeciesId.REUNICLUS ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.COSMOG ], 43: [ SpeciesId.COSMOEM ]}, SpeciesId.CELESTEELA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.SOLROCK ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.LUNATONE ], [TimeOfDay.ALL]: [ SpeciesId.CLEFABLE, SpeciesId.BRONZONG, SpeciesId.MUSHARNA, SpeciesId.REUNICLUS, SpeciesId.MINIOR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.METAGROSS, SpeciesId.PORYGON_Z ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CELESTEELA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.SOLGALEO ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.LUNALA ], [TimeOfDay.ALL]: [ SpeciesId.RAYQUAZA, SpeciesId.NECROZMA ]}
  },
  [Biome.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ]},
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ]},
        { 1: [ SpeciesId.DRILBUR ], 31: [ SpeciesId.EXCADRILL ]},
        { 1: [ SpeciesId.TIMBURR ], 25: [ SpeciesId.GURDURR ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ]},
        { 1: [ SpeciesId.KOFFING ], 35: [ SpeciesId.WEEZING ]},
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ]},
        { 1: [ SpeciesId.SCRAGGY ], 39: [ SpeciesId.SCRAFTY ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.GALAR_MEOWTH ], 28: [ SpeciesId.PERRSERKER ]}], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.DURALUDON ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.HITMONTOP ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MACHAMP, SpeciesId.CONKELDURR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.PERRSERKER ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARCHALUDON ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.JUNGLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.VESPIQUEN, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ]}, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ]}],
      [TimeOfDay.DAY]: [ SpeciesId.VESPIQUEN, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ]}, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ]}],
      [TimeOfDay.DUSK]: [ SpeciesId.SHROOMISH, { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ]}, { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ]}, SpeciesId.SHROOMISH, { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ]}, { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}],
      [TimeOfDay.ALL]: [ SpeciesId.AIPOM, { 1: [ SpeciesId.BLITZLE ], 27: [ SpeciesId.ZEBSTRIKA ]}, { 1: [ SpeciesId.PIKIPEK ], 14: [ SpeciesId.TRUMBEAK ], 28: [ SpeciesId.TOUCANNON ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DUSK]: [ SpeciesId.TANGELA, { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ]}, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ]}],
      [TimeOfDay.NIGHT]: [ SpeciesId.TANGELA, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PANSAGE ], 30: [ SpeciesId.SIMISAGE ]},
        { 1: [ SpeciesId.PANSEAR ], 30: [ SpeciesId.SIMISEAR ]},
        { 1: [ SpeciesId.PANPOUR ], 30: [ SpeciesId.SIMIPOUR ]},
        { 1: [ SpeciesId.JOLTIK ], 36: [ SpeciesId.GALVANTULA ]},
        { 1: [ SpeciesId.LITLEO ], 35: [ SpeciesId.PYROAR ]},
        { 1: [ SpeciesId.FOMANTIS ], 44: [ SpeciesId.LURANTIS ]},
        SpeciesId.FALINKS
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}, SpeciesId.PASSIMIAN, { 1: [ SpeciesId.GALAR_PONYTA ], 40: [ SpeciesId.GALAR_RAPIDASH ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ]}, SpeciesId.PASSIMIAN ],
      [TimeOfDay.DUSK]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.ALL]: [
        SpeciesId.SCYTHER,
        SpeciesId.YANMA,
        { 1: [ SpeciesId.SLAKOTH ], 18: [ SpeciesId.VIGOROTH ], 36: [ SpeciesId.SLAKING ]},
        SpeciesId.SEVIPER,
        SpeciesId.CARNIVINE,
        { 1: [ SpeciesId.SNIVY ], 17: [ SpeciesId.SERVINE ], 36: [ SpeciesId.SERPERIOR ]},
        { 1: [ SpeciesId.GROOKEY ], 16: [ SpeciesId.THWACKEY ], 35: [ SpeciesId.RILLABOOM ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KANGASKHAN, SpeciesId.CHATOT, SpeciesId.KLEAVOR ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TAPU_LELE, SpeciesId.BUZZWOLE, SpeciesId.ZARUDE, SpeciesId.MUNKIDORI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGUTOR, SpeciesId.TROPIUS, SpeciesId.CHERRIM, SpeciesId.LEAVANNY, SpeciesId.KOMALA ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGUTOR, SpeciesId.TROPIUS, SpeciesId.CHERRIM, SpeciesId.LEAVANNY, SpeciesId.KOMALA ],
      [TimeOfDay.DUSK]: [ SpeciesId.BRELOOM, SpeciesId.TANGROWTH, SpeciesId.AMOONGUSS, SpeciesId.PANGORO ],
      [TimeOfDay.NIGHT]: [ SpeciesId.BRELOOM, SpeciesId.TANGROWTH, SpeciesId.AMOONGUSS, SpeciesId.PANGORO ],
      [TimeOfDay.ALL]: [ SpeciesId.SEVIPER, SpeciesId.AMBIPOM, SpeciesId.CARNIVINE, SpeciesId.YANMEGA, SpeciesId.GALVANTULA, SpeciesId.PYROAR, SpeciesId.TOUCANNON, SpeciesId.LURANTIS, SpeciesId.FALINKS ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.AMOONGUSS, SpeciesId.GALAR_RAPIDASH ],
      [TimeOfDay.DAY]: [ SpeciesId.AMOONGUSS ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.KANGASKHAN, SpeciesId.SCIZOR, SpeciesId.SLAKING, SpeciesId.LEAFEON, SpeciesId.SERPERIOR, SpeciesId.RILLABOOM ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TAPU_LELE, SpeciesId.BUZZWOLE, SpeciesId.ZARUDE, SpeciesId.MUNKIDORI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KLEAVOR ]}
  },
  [Biome.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.JIGGLYPUFF ], 30: [ SpeciesId.WIGGLYTUFF ]},
        { 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ]},
        SpeciesId.MAWILE,
        { 1: [ SpeciesId.SPRITZEE ], 40: [ SpeciesId.AROMATISSE ]},
        { 1: [ SpeciesId.SWIRLIX ], 40: [ SpeciesId.SLURPUFF ]},
        { 1: [ SpeciesId.CUTIEFLY ], 25: [ SpeciesId.RIBOMBEE ]},
        { 1: [ SpeciesId.MORELULL ], 24: [ SpeciesId.SHIINOTIC ]},
        { 1: [ SpeciesId.MILCERY ], 30: [ SpeciesId.ALCREMIE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.CLEFAIRY,
        SpeciesId.TOGETIC,
        { 1: [ SpeciesId.RALTS ], 20: [ SpeciesId.KIRLIA ], 30: [ SpeciesId.GARDEVOIR ]},
        SpeciesId.CARBINK,
        SpeciesId.COMFEY,
        { 1: [ SpeciesId.HATENNA ], 32: [ SpeciesId.HATTREM ], 42: [ SpeciesId.HATTERENE ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AUDINO, SpeciesId.ETERNAL_FLOETTE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIANCIE, SpeciesId.ENAMORUS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.WIGGLYTUFF, SpeciesId.MAWILE, SpeciesId.TOGEKISS, SpeciesId.AUDINO, SpeciesId.AROMATISSE, SpeciesId.SLURPUFF, SpeciesId.CARBINK, SpeciesId.RIBOMBEE, SpeciesId.SHIINOTIC, SpeciesId.COMFEY, SpeciesId.HATTERENE, SpeciesId.ALCREMIE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ETERNAL_FLOETTE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIANCIE, SpeciesId.ENAMORUS ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.XERNEAS ]}
  },
  [Biome.TEMPLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GASTLY ], 25: [ SpeciesId.HAUNTER ]},
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ]},
        { 1: [ SpeciesId.DUSKULL ], 37: [ SpeciesId.DUSCLOPS ]},
        { 1: [ SpeciesId.YAMASK ], 34: [ SpeciesId.COFAGRIGUS ]},
        { 1: [ SpeciesId.GOLETT ], 43: [ SpeciesId.GOLURK ]},
        { 1: [ SpeciesId.HONEDGE ], 35: [ SpeciesId.DOUBLADE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ]},
        { 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ]},
        { 1: [ SpeciesId.CHINGLING ], 20: [ SpeciesId.CHIMECHO ]},
        { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ]},
        { 1: [ SpeciesId.LITWICK ], 41: [ SpeciesId.LAMPENT ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.GIMMIGHOUL ], 40: [ SpeciesId.GHOLDENGO ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HOOPA, SpeciesId.TAPU_KOKO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CHIMECHO, SpeciesId.COFAGRIGUS, SpeciesId.GOLURK, SpeciesId.AEGISLASH ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GHOLDENGO ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HOOPA, SpeciesId.TAPU_KOKO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIGIGAS ]}
  },
  [Biome.SLUM]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ]}],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.RATTATA ], 20: [ SpeciesId.RATICATE ]},
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ]},
        { 1: [ SpeciesId.KOFFING ], 35: [ SpeciesId.WEEZING ]},
        { 1: [ SpeciesId.TRUBBISH ], 36: [ SpeciesId.GARBODOR ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.STUNKY ], 34: [ SpeciesId.SKUNTANK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.STUNKY ], 34: [ SpeciesId.SKUNTANK ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ]}]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.TOXTRICITY, { 1: [ SpeciesId.GALAR_LINOONE ], 65: [ SpeciesId.OBSTAGOON ]}, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TOXTRICITY, { 1: [ SpeciesId.GALAR_LINOONE ], 65: [ SpeciesId.OBSTAGOON ]}, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.VAROOM ], 40: [ SpeciesId.REVAVROOM ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GUZZLORD ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.SKUNTANK, SpeciesId.WATCHOG ], [TimeOfDay.NIGHT]: [ SpeciesId.SKUNTANK, SpeciesId.WATCHOG ], [TimeOfDay.ALL]: [ SpeciesId.MUK, SpeciesId.WEEZING, SpeciesId.WORMADAM, SpeciesId.GARBODOR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.TOXTRICITY, SpeciesId.OBSTAGOON ], [TimeOfDay.NIGHT]: [ SpeciesId.TOXTRICITY, SpeciesId.OBSTAGOON ], [TimeOfDay.ALL]: [ SpeciesId.REVAVROOM, SpeciesId.GALAR_WEEZING ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GUZZLORD ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]}, { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ]}],
      [TimeOfDay.NIGHT]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]}, { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.SWINUB ], 33: [ SpeciesId.PILOSWINE ]}, { 1: [ SpeciesId.SNOVER ], 40: [ SpeciesId.ABOMASNOW ]}, SpeciesId.EISCUE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]}, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ]}, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ SpeciesId.GALAR_DARUMAKA ], 30: [ SpeciesId.GALAR_DARMANITAN ]}],
      [TimeOfDay.DAY]: [{ 1: [ SpeciesId.GALAR_DARUMAKA ], 30: [ SpeciesId.GALAR_DARMANITAN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, { 1: [ SpeciesId.ALOLA_SANDSHREW ], 30: [ SpeciesId.ALOLA_SANDSLASH ]}, { 1: [ SpeciesId.ALOLA_VULPIX ], 30: [ SpeciesId.ALOLA_NINETALES ]}]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DAY]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.HISUI_ZORUA ], 30: [ SpeciesId.HISUI_ZOROARK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.HISUI_ZORUA ], 30: [ SpeciesId.HISUI_ZOROARK ]}],
      [TimeOfDay.ALL]: [{ 1: [ SpeciesId.GALAR_MR_MIME ], 42: [ SpeciesId.MR_RIME ]}, SpeciesId.ARCTOZOLT, SpeciesId.HISUI_AVALUGG ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GLASTRIER, SpeciesId.CHIEN_PAO, SpeciesId.GALAR_ARTICUNO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.WYRDEER ], [TimeOfDay.DAY]: [ SpeciesId.WYRDEER ], [TimeOfDay.DUSK]: [ SpeciesId.FROSMOTH ], [TimeOfDay.NIGHT]: [ SpeciesId.FROSMOTH ], [TimeOfDay.ALL]: [ SpeciesId.ABOMASNOW, SpeciesId.URSALUNA ]},
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SNEASLER, SpeciesId.GALAR_DARMANITAN ],
      [TimeOfDay.DAY]: [ SpeciesId.SNEASLER, SpeciesId.GALAR_DARMANITAN ],
      [TimeOfDay.DUSK]: [ SpeciesId.HISUI_ZOROARK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.HISUI_ZOROARK ],
      [TimeOfDay.ALL]: [ SpeciesId.MR_RIME, SpeciesId.ARCTOZOLT, SpeciesId.ALOLA_SANDSLASH, SpeciesId.ALOLA_NINETALES ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GLASTRIER, SpeciesId.CHIEN_PAO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZACIAN, SpeciesId.GALAR_ARTICUNO ]}
  },
  [Biome.ISLAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ SpeciesId.ALOLA_RATTATA ], 30: [ SpeciesId.ALOLA_RATICATE ]}, { 1: [ SpeciesId.ALOLA_MEOWTH ], 30: [ SpeciesId.ALOLA_PERSIAN ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ SpeciesId.ALOLA_RATTATA ], 30: [ SpeciesId.ALOLA_RATICATE ]}, { 1: [ SpeciesId.ALOLA_MEOWTH ], 30: [ SpeciesId.ALOLA_PERSIAN ]}],
      [TimeOfDay.ALL]: [
        SpeciesId.ORICORIO,
        { 1: [ SpeciesId.ALOLA_SANDSHREW ], 30: [ SpeciesId.ALOLA_SANDSLASH ]},
        { 1: [ SpeciesId.ALOLA_VULPIX ], 30: [ SpeciesId.ALOLA_NINETALES ]},
        { 1: [ SpeciesId.ALOLA_DIGLETT ], 26: [ SpeciesId.ALOLA_DUGTRIO ]},
        { 1: [ SpeciesId.ALOLA_GEODUDE ], 25: [ SpeciesId.ALOLA_GRAVELER ], 40: [ SpeciesId.ALOLA_GOLEM ]},
        { 1: [ SpeciesId.ALOLA_GRIMER ], 38: [ SpeciesId.ALOLA_MUK ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.BRUXISH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLACEPHALON ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.ORICORIO, SpeciesId.BRUXISH, SpeciesId.ALOLA_SANDSLASH, SpeciesId.ALOLA_NINETALES, SpeciesId.ALOLA_DUGTRIO, SpeciesId.ALOLA_GOLEM, SpeciesId.ALOLA_MUK ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLACEPHALON ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.LABORATORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ]},
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ]},
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ]},
        { 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ]},
        { 1: [ SpeciesId.KLINK ], 38: [ SpeciesId.KLANG ], 49: [ SpeciesId.KLINKLANG ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ SpeciesId.SOLOSIS ], 32: [ SpeciesId.DUOSION ], 41: [ SpeciesId.REUNICLUS ]}]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, { 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TYPE_NULL ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MUK, SpeciesId.ELECTRODE, SpeciesId.BRONZONG, SpeciesId.MAGNEZONE, SpeciesId.PORYGON_Z, SpeciesId.REUNICLUS, SpeciesId.KLINKLANG ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM, SpeciesId.ZYGARDE, SpeciesId.SILVALLY ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MEWTWO, SpeciesId.MIRAIDON ]}
  },
  [Biome.END]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.GREAT_TUSK,
        SpeciesId.SCREAM_TAIL,
        SpeciesId.BRUTE_BONNET,
        SpeciesId.FLUTTER_MANE,
        SpeciesId.SLITHER_WING,
        SpeciesId.SANDY_SHOCKS,
        SpeciesId.IRON_TREADS,
        SpeciesId.IRON_BUNDLE,
        SpeciesId.IRON_HANDS,
        SpeciesId.IRON_JUGULIS,
        SpeciesId.IRON_MOTH,
        SpeciesId.IRON_THORNS
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROARING_MOON, SpeciesId.IRON_VALIANT ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.WALKING_WAKE, SpeciesId.IRON_LEAVES, SpeciesId.GOUGING_FIRE, SpeciesId.RAGING_BOLT, SpeciesId.IRON_BOULDER, SpeciesId.IRON_CROWN ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ETERNATUS ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  }
};

export const biomeTrainerPools: BiomeTrainerPools = {
  [Biome.TOWN]: {
    [BiomePoolTier.COMMON]: [ TrainerType.YOUNGSTER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.PLAINS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.TWINS ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.CYCLIST ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CILAN, TrainerType.CHILI, TrainerType.CRESS, TrainerType.CHEREN ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.SCHOOL_KID ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.POKEFAN ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.ERIKA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER, TrainerType.RANGER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GARDENIA, TrainerType.VIOLA, TrainerType.BRASSIUS ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY, TrainerType.CLERK, TrainerType.CYCLIST, TrainerType.OFFICER, TrainerType.WAITER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BREEDER, TrainerType.DEPOT_AGENT, TrainerType.GUITARIST ],
    [BiomePoolTier.RARE]: [ TrainerType.ARTIST, TrainerType.RICH_KID ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.WHITNEY, TrainerType.NORMAN, TrainerType.IONO, TrainerType.LARRY ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.FOREST]: {
    [BiomePoolTier.COMMON]: [ TrainerType.RANGER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BUGSY, TrainerType.BURGH, TrainerType.KATY ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SAILOR, TrainerType.SWIMMER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MARLON ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SWAMP]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JANINE, TrainerType.ROXIE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: [ TrainerType.FISHERMAN, TrainerType.SAILOR ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MISTY, TrainerType.KOFU ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.FISHERMAN, TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CRASHER_WAKE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JUAN ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.BLACK_BELT, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.PILOT ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.FALKNER, TrainerType.WINONA, TrainerType.SKYLA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.BADLANDS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CLAY, TrainerType.GRANT ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BROCK, TrainerType.ROXANNE, TrainerType.ROARK ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.SCIENTIST ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GORDIE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SNOW_WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.PRYCE, TrainerType.BRYCEN, TrainerType.WULFRIC, TrainerType.GRUSHA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY, TrainerType.MUSICIAN, TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BAKER, TrainerType.BREEDER, TrainerType.POKEFAN ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.LENORA, TrainerType.MILO ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: [ TrainerType.GUITARIST, TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.VOLKNER, TrainerType.ELESA, TrainerType.CLEMONT ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.VOLCANO]: {
    [BiomePoolTier.COMMON]: [ TrainerType.FIREBREATHER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BLAINE, TrainerType.FLANNERY, TrainerType.KABU ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PSYCHIC ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.HEX_MANIAC ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MORTY, TrainerType.ALLISTER, TrainerType.RYME ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BRAWLY, TrainerType.MAYLENE, TrainerType.KORRINA, TrainerType.BEA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: [ TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JASMINE, TrainerType.BYRON ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.RUINS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PSYCHIC, TrainerType.SCIENTIST ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT, TrainerType.HEX_MANIAC ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.SABRINA, TrainerType.TATE, TrainerType.LIZA, TrainerType.TULIP ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: [ TrainerType.VETERAN ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CLAIR, TrainerType.DRAYDEN, TrainerType.RAIHAN ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MARNIE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.OLYMPIA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.OFFICER, TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.LT_SURGE, TrainerType.CHUCK, TrainerType.WATTSON ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.JUNGLE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.RANGER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.RAMOS ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.VALERIE, TrainerType.OPAL, TrainerType.BEDE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.TEMPLE]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.FANTINA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SLUM]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BIKER, TrainerType.OFFICER, TrainerType.ROUGHNECK ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BAKER, TrainerType.HOOLIGANS ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.PIERS ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SNOW_WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CANDICE, TrainerType.MELONY ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.ISLAND]: {
    [BiomePoolTier.COMMON]: [ TrainerType.RICH_KID ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.RICH ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.NESSA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.LABORATORY]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GIOVANNI ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.END]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  }
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: init methods are expected to have many lines.
export function initBiomes() {
  const pokemonBiomes = [
    [ SpeciesId.BULBASAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.IVYSAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.VENUSAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CHARMANDER, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CHARMELEON, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CHARIZARD, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SQUIRTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.WARTORTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BLASTOISE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CATERPIE, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.METAPOD, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BUTTERFREE, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.WEEDLE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.KAKUNA, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.BEEDRILL, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PIDGEY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PIDGEOTTO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PIDGEOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.RATTATA, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.RATICATE, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SPEAROW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FEAROW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.EKANS, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ARBOK, PokemonType.POISON, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PIKACHU, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.RAICHU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SANDSHREW, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SANDSLASH, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.NIDORAN_F, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.NIDORINA, PokemonType.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.NIDOQUEEN, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.NIDORAN_M, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.NIDORINO, PokemonType.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.NIDOKING, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.CLEFAIRY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CLEFABLE, PokemonType.FAIRY, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.VULPIX, PokemonType.FIRE, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.NINETALES, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.JIGGLYPUFF, PokemonType.NORMAL, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.WIGGLYTUFF, PokemonType.NORMAL, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ZUBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GOLBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ODDISH, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.GLOOM, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.VILEPLUME, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PARAS, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PARASECT, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.VENONAT, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.VENOMOTH, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.DIGLETT, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DUGTRIO, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MEOWTH, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PERSIAN, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PSYDUCK, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GOLDUCK, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MANKEY, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PRIMEAPE, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GROWLITHE, PokemonType.FIRE, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ARCANINE, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.POLIWAG, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.POLIWHIRL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.POLIWRATH, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ABRA, PokemonType.PSYCHIC, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.KADABRA, PokemonType.PSYCHIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.ALAKAZAM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MACHOP, PokemonType.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MACHOKE, PokemonType.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MACHAMP, PokemonType.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BELLSPROUT, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.WEEPINBELL, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VICTREEBEL, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TENTACOOL, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.TENTACRUEL, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GEODUDE, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GRAVELER, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GOLEM, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PONYTA, PokemonType.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.RAPIDASH, PokemonType.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SLOWPOKE, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SLOWBRO, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAGNEMITE, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MAGNETON, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FARFETCHD, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DODUO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.DODRIO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SEEL, PokemonType.WATER, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DEWGONG, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GRIMER, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MUK, PokemonType.POISON, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHELLDER, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CLOYSTER, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.GASTLY, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HAUNTER, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GENGAR, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ONIX, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DROWZEE, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HYPNO, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.KRABBY, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.KINGLER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.VOLTORB, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ELECTRODE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.EXEGGCUTE, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.EXEGGUTOR, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CUBONE, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MAROWAK, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY, TimeOfDay.DUSK ]]
    ]
    ],
    [ SpeciesId.HITMONLEE, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.HITMONCHAN, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.LICKITUNG, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.KOFFING, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.WEEZING, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.RHYHORN, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.RHYDON, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CHANSEY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TANGELA, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.KANGASKHAN, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HORSEA, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SEADRA, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GOLDEEN, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SEAKING, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.STARYU, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.STARMIE, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.MR_MIME, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SCYTHER, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.JYNX, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ELECTABUZZ, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MAGMAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PINSIR, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TAUROS, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAGIKARP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GYARADOS, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.LAPRAS, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DITTO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EEVEE, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.VAPOREON, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.JOLTEON, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FLAREON, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PORYGON, PokemonType.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.OMANYTE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.OMASTAR, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.KABUTO, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.KABUTOPS, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.AERODACTYL, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SNORLAX, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ARTICUNO, PokemonType.ICE, PokemonType.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ZAPDOS, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MOLTRES, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.DRATINI, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DRAGONAIR, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DRAGONITE, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MEWTWO, PokemonType.PSYCHIC, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.MEW, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ SpeciesId.CHIKORITA, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BAYLEEF, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.MEGANIUM, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CYNDAQUIL, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.QUILAVA, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TYPHLOSION, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TOTODILE, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CROCONAW, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FERALIGATR, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SENTRET, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FURRET, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HOOTHOOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.NOCTOWL, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.LEDYBA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ]
    ]
    ],
    [ SpeciesId.LEDIAN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, TimeOfDay.DAWN ]
    ]
    ],
    [ SpeciesId.SPINARAK, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.ARIADOS, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.CROBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CHINCHOU, PokemonType.WATER, PokemonType.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LANTURN, PokemonType.WATER, PokemonType.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PICHU, PokemonType.ELECTRIC, -1, [ ]
    ],
    [ SpeciesId.CLEFFA, PokemonType.FAIRY, -1, [ ]
    ],
    [ SpeciesId.IGGLYBUFF, PokemonType.NORMAL, PokemonType.FAIRY, [ ]
    ],
    [ SpeciesId.TOGEPI, PokemonType.FAIRY, -1, [ ]
    ],
    [ SpeciesId.TOGETIC, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.NATU, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.XATU, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MAREEP, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FLAAFFY, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.AMPHAROS, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.BELLOSSOM, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.MARILL, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.AZUMARILL, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SUDOWOODO, PokemonType.ROCK, -1, [
      [ Biome.GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.POLITOED, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HOPPIP, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SKIPLOOM, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.JUMPLUFF, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.AIPOM, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SUNKERN, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SUNFLORA, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.YANMA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.WOOPER, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.QUAGSIRE, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ESPEON, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, TimeOfDay.DAY ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.UMBREON, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.MURKROW, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SLOWKING, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.MISDREAVUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.UNOWN, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.WOBBUFFET, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GIRAFARIG, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.PINECO, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.FORRETRESS, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.DUNSPARCE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GLIGAR, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.STEELIX, PokemonType.STEEL, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SNUBBULL, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GRANBULL, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.QWILFISH, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SCIZOR, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SHUCKLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HERACROSS, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SNEASEL, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TEDDIURSA, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.URSARING, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SLUGMA, PokemonType.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MAGCARGO, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SWINUB, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PILOSWINE, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CORSOLA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.REMORAID, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.OCTILLERY, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DELIBIRD, PokemonType.ICE, PokemonType.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.MANTINE, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SKARMORY, PokemonType.STEEL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.HOUNDOUR, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HOUNDOOM, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.KINGDRA, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PHANPY, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.DONPHAN, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PORYGON2, PokemonType.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.STANTLER, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SMEARGLE, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TYROGUE, PokemonType.FIGHTING, -1, [ ]
    ],
    [ SpeciesId.HITMONTOP, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SMOOCHUM, PokemonType.ICE, PokemonType.PSYCHIC, [ ]
    ],
    [ SpeciesId.ELEKID, PokemonType.ELECTRIC, -1, [ ]
    ],
    [ SpeciesId.MAGBY, PokemonType.FIRE, -1, [ ]
    ],
    [ SpeciesId.MILTANK, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BLISSEY, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.RAIKOU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ENTEI, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SUICUNE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.LARVITAR, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PUPITAR, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.TYRANITAR, PokemonType.ROCK, PokemonType.DARK, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.LUGIA, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.HO_OH, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.CELEBI, PokemonType.PSYCHIC, PokemonType.GRASS, [ ]
    ],
    [ SpeciesId.TREECKO, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GROVYLE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SCEPTILE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TORCHIC, PokemonType.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.COMBUSKEN, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BLAZIKEN, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.MUDKIP, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.MARSHTOMP, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SWAMPERT, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.POOCHYENA, PokemonType.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.MIGHTYENA, PokemonType.DARK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ZIGZAGOON, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LINOONE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.WURMPLE, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SILCOON, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.BEAUTIFLY, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.CASCOON, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.DUSTOX, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.LOTAD, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.LOMBRE, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.LUDICOLO, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SEEDOT, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.NUZLEAF, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SHIFTRY, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.TAILLOW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SWELLOW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.WINGULL, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PELIPPER, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.RALTS, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.KIRLIA, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GARDEVOIR, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SURSKIT, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MASQUERAIN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHROOMISH, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.BRELOOM, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SLAKOTH, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.VIGOROTH, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SLAKING, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.NINCADA, PokemonType.BUG, PokemonType.GROUND, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.NINJASK, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHEDINJA, PokemonType.BUG, PokemonType.GHOST, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.WHISMUR, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LOUDRED, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.EXPLOUD, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAKUHITA, PokemonType.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HARIYAMA, PokemonType.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.AZURILL, PokemonType.NORMAL, PokemonType.FAIRY, [ ]
    ],
    [ SpeciesId.NOSEPASS, PokemonType.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SKITTY, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.DELCATTY, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SABLEYE, PokemonType.DARK, PokemonType.GHOST, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAWILE, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ARON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.LAIRON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.AGGRON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MEDITITE, PokemonType.FIGHTING, PokemonType.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MEDICHAM, PokemonType.FIGHTING, PokemonType.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ELECTRIKE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MANECTRIC, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PLUSLE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MINUN, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.VOLBEAT, PokemonType.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.ILLUMISE, PokemonType.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.ROSELIA, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GULPIN, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SWALOT, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CARVANHA, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SHARPEDO, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.WAILMER, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.WAILORD, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.NUMEL, PokemonType.FIRE, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CAMERUPT, PokemonType.FIRE, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TORKOAL, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SPOINK, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GRUMPIG, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SPINDA, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TRAPINCH, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VIBRAVA, PokemonType.GROUND, PokemonType.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FLYGON, PokemonType.GROUND, PokemonType.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CACNEA, PokemonType.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.CACTURNE, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SWABLU, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.ALTARIA, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.ZANGOOSE, PokemonType.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SEVIPER, PokemonType.POISON, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.LUNATONE, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.SOLROCK, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.BARBOACH, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.WHISCASH, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CORPHISH, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CRAWDAUNT, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BALTOY, PokemonType.GROUND, PokemonType.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CLAYDOL, PokemonType.GROUND, PokemonType.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.LILEEP, PokemonType.ROCK, PokemonType.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CRADILY, PokemonType.ROCK, PokemonType.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ANORITH, PokemonType.ROCK, PokemonType.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ARMALDO, PokemonType.ROCK, PokemonType.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FEEBAS, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.MILOTIC, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CASTFORM, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.KECLEON, PokemonType.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHUPPET, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BANETTE, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DUSKULL, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DUSCLOPS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.TROPIUS, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CHIMECHO, PokemonType.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ABSOL, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.WYNAUT, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ SpeciesId.SNORUNT, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GLALIE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SPHEAL, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SEALEO, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.WALREIN, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CLAMPERL, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HUNTAIL, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GOREBYSS, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.RELICANTH, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.LUVDISC, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BAGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SHELGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SALAMENCE, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BELDUM, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.METANG, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.METAGROSS, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.REGIROCK, PokemonType.ROCK, -1, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.REGICE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.REGISTEEL, PokemonType.STEEL, -1, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.LATIAS, PokemonType.DRAGON, PokemonType.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.LATIOS, PokemonType.DRAGON, PokemonType.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.KYOGRE, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.GROUDON, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.RAYQUAZA, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.JIRACHI, PokemonType.STEEL, PokemonType.PSYCHIC, [ ]
    ],
    [ SpeciesId.DEOXYS, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ SpeciesId.TURTWIG, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GROTLE, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TORTERRA, PokemonType.GRASS, PokemonType.GROUND, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CHIMCHAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.MONFERNO, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.INFERNAPE, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PIPLUP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.PRINPLUP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EMPOLEON, PokemonType.WATER, PokemonType.STEEL, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.STARLY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.STARAVIA, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.STARAPTOR, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BIDOOF, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BIBAREL, PokemonType.NORMAL, PokemonType.WATER, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.KRICKETOT, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.KRICKETUNE, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SHINX, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LUXIO, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LUXRAY, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BUDEW, PokemonType.GRASS, PokemonType.POISON, [ ]
    ],
    [ SpeciesId.ROSERADE, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CRANIDOS, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.RAMPARDOS, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SHIELDON, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.BASTIODON, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.BURMY, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.WORMADAM, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MOTHIM, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.COMBEE, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VESPIQUEN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PACHIRISU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.BUIZEL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FLOATZEL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CHERUBI, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CHERRIM, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SHELLOS, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GASTRODON, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.AMBIPOM, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DRIFLOON, PokemonType.GHOST, PokemonType.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DRIFBLIM, PokemonType.GHOST, PokemonType.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BUNEARY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.LOPUNNY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MISMAGIUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.HONCHKROW, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GLAMEOW, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PURUGLY, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CHINGLING, PokemonType.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.STUNKY, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SKUNTANK, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.BRONZOR, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BRONZONG, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BONSLY, PokemonType.ROCK, -1, [ ]
    ],
    [ SpeciesId.MIME_JR, PokemonType.PSYCHIC, PokemonType.FAIRY, [ ]
    ],
    [ SpeciesId.HAPPINY, PokemonType.NORMAL, -1, [ ]
    ],
    [ SpeciesId.CHATOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SPIRITOMB, PokemonType.GHOST, PokemonType.DARK, [
      [ Biome.GRAVEYARD, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GIBLE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GABITE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GARCHOMP, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MUNCHLAX, PokemonType.NORMAL, -1, [ ]
    ],
    [ SpeciesId.RIOLU, PokemonType.FIGHTING, -1, [ ]
    ],
    [ SpeciesId.LUCARIO, PokemonType.FIGHTING, PokemonType.STEEL, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.HIPPOPOTAS, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HIPPOWDON, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SKORUPI, PokemonType.POISON, PokemonType.BUG, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.DRAPION, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CROAGUNK, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.TOXICROAK, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CARNIVINE, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FINNEON, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.LUMINEON, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SEA, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.MANTYKE, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SNOVER, PokemonType.GRASS, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ABOMASNOW, PokemonType.GRASS, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.WEAVILE, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAGNEZONE, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.LICKILICKY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.RHYPERIOR, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TANGROWTH, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ELECTIVIRE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAGMORTAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TOGEKISS, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.YANMEGA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.LEAFEON, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GLACEON, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GLISCOR, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAMOSWINE, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PORYGON_Z, PokemonType.NORMAL, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GALLADE, PokemonType.PSYCHIC, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PROBOPASS, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DUSKNOIR, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FROSLASS, PokemonType.ICE, PokemonType.GHOST, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ROTOM, PokemonType.ELECTRIC, PokemonType.GHOST, [
      [ Biome.LABORATORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ],
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_SUPER_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.UXIE, PokemonType.PSYCHIC, -1, [
      [ Biome.CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MESPRIT, PokemonType.PSYCHIC, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.AZELF, PokemonType.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.DIALGA, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.PALKIA, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.HEATRAN, PokemonType.FIRE, PokemonType.STEEL, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.REGIGIGAS, PokemonType.NORMAL, -1, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.GIRATINA, PokemonType.GHOST, PokemonType.DRAGON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.CRESSELIA, PokemonType.PSYCHIC, -1, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.PHIONE, PokemonType.WATER, -1, [ ]
    ],
    [ SpeciesId.MANAPHY, PokemonType.WATER, -1, [ ]
    ],
    [ SpeciesId.DARKRAI, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SHAYMIN, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.ARCEUS, PokemonType.NORMAL, -1, [ ]
    ],
    [ SpeciesId.VICTINI, PokemonType.PSYCHIC, PokemonType.FIRE, [ ]
    ],
    [ SpeciesId.SNIVY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SERVINE, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SERPERIOR, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TEPIG, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.PIGNITE, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EMBOAR, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.OSHAWOTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DEWOTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SAMUROTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PATRAT, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.WATCHOG, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.LILLIPUP, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HERDIER, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.STOUTLAND, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PURRLOIN, PokemonType.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.LIEPARD, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PANSAGE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SIMISAGE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PANSEAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SIMISEAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PANPOUR, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SIMIPOUR, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MUNNA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MUSHARNA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PIDOVE, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TRANQUILL, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.UNFEZANT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BLITZLE, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ZEBSTRIKA, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ROGGENROLA, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BOLDORE, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GIGALITH, PokemonType.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.WOOBAT, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SWOOBAT, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DRILBUR, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.EXCADRILL, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.AUDINO, PokemonType.NORMAL, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TIMBURR, PokemonType.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GURDURR, PokemonType.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CONKELDURR, PokemonType.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TYMPOLE, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PALPITOAD, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SEISMITOAD, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.THROH, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SAWK, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SEWADDLE, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SWADLOON, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.LEAVANNY, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VENIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.WHIRLIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SCOLIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.COTTONEE, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.WHIMSICOTT, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PETILIL, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.LILLIGANT, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BASCULIN, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SANDILE, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.KROKOROK, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.KROOKODILE, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.DARUMAKA, PokemonType.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DARMANITAN, PokemonType.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MARACTUS, PokemonType.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DWEBBLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CRUSTLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SCRAGGY, PokemonType.DARK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SCRAFTY, PokemonType.DARK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SIGILYPH, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.YAMASK, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.COFAGRIGUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TIRTOUGA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CARRACOSTA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ARCHEN, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ARCHEOPS, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TRUBBISH, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GARBODOR, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ZORUA, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ZOROARK, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MINCCINO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CINCCINO, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GOTHITA, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GOTHORITA, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GOTHITELLE, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SOLOSIS, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.DUOSION, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.REUNICLUS, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DUCKLETT, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SWANNA, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VANILLITE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.VANILLISH, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.VANILLUXE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DEERLING, PokemonType.NORMAL, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SAWSBUCK, PokemonType.NORMAL, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.EMOLGA, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.KARRABLAST, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ESCAVALIER, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FOONGUS, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.AMOONGUSS, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.FRILLISH, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.JELLICENT, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ALOMOMOLA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.JOLTIK, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GALVANTULA, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FERROSEED, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FERROTHORN, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.KLINK, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.KLANG, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.KLINKLANG, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TYNAMO, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EELEKTRIK, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EELEKTROSS, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ELGYEM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.BEHEEYEM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.LITWICK, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.LAMPENT, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CHANDELURE, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.AXEW, PokemonType.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FRAXURE, PokemonType.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HAXORUS, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CUBCHOO, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BEARTIC, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CRYOGONAL, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHELMET, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ACCELGOR, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.STUNFISK, PokemonType.GROUND, PokemonType.ELECTRIC, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MIENFOO, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.MIENSHAO, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DRUDDIGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GOLETT, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GOLURK, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PAWNIARD, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BISHARP, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BOUFFALANT, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.RUFFLET, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BRAVIARY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VULLABY, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.MANDIBUZZ, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.HEATMOR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DURANT, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DEINO, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ZWEILOUS, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.HYDREIGON, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.LARVESTA, PokemonType.BUG, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.VOLCARONA, PokemonType.BUG, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.COBALION, PokemonType.STEEL, PokemonType.FIGHTING, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TERRAKION, PokemonType.ROCK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.VIRIZION, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TORNADUS, PokemonType.FLYING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.THUNDURUS, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.RESHIRAM, PokemonType.DRAGON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.ZEKROM, PokemonType.DRAGON, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.LANDORUS, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.KYUREM, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.KELDEO, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MELOETTA, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.MEADOW, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GENESECT, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CHESPIN, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.QUILLADIN, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CHESNAUGHT, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FENNEKIN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BRAIXEN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DELPHOX, PokemonType.FIRE, PokemonType.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FROAKIE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FROGADIER, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GRENINJA, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.BUNNELBY, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DIGGERSBY, PokemonType.NORMAL, PokemonType.GROUND, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FLETCHLING, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FLETCHINDER, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TALONFLAME, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SCATTERBUG, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SPEWPA, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VIVILLON, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.LITLEO, PokemonType.FIRE, PokemonType.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PYROAR, PokemonType.FIRE, PokemonType.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FLABEBE, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FLOETTE, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FLORGES, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SKIDDO, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GOGOAT, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PANCHAM, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PANGORO, PokemonType.FIGHTING, PokemonType.DARK, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.FURFROU, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ESPURR, PokemonType.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.MEOWSTIC, PokemonType.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.HONEDGE, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DOUBLADE, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.AEGISLASH, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SPRITZEE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.AROMATISSE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SWIRLIX, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SLURPUFF, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.INKAY, PokemonType.DARK, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.MALAMAR, PokemonType.DARK, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.BINACLE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BARBARACLE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SKRELP, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.DRAGALGE, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CLAUNCHER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CLAWITZER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.HELIOPTILE, PokemonType.ELECTRIC, PokemonType.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HELIOLISK, PokemonType.ELECTRIC, PokemonType.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TYRUNT, PokemonType.ROCK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TYRANTRUM, PokemonType.ROCK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.AMAURA, PokemonType.ROCK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.AURORUS, PokemonType.ROCK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SYLVEON, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HAWLUCHA, PokemonType.FIGHTING, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DEDENNE, PokemonType.ELECTRIC, PokemonType.FAIRY, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CARBINK, PokemonType.ROCK, PokemonType.FAIRY, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GOOMY, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SLIGGOO, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GOODRA, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.KLEFKI, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PHANTUMP, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.TREVENANT, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PUMPKABOO, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GOURGEIST, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BERGMITE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.AVALUGG, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.NOIBAT, PokemonType.FLYING, PokemonType.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.NOIVERN, PokemonType.FLYING, PokemonType.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.XERNEAS, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.YVELTAL, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.ZYGARDE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.DIANCIE, PokemonType.ROCK, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.HOOPA, PokemonType.PSYCHIC, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.VOLCANION, PokemonType.FIRE, PokemonType.WATER, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ROWLET, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DARTRIX, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DECIDUEYE, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.LITTEN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TORRACAT, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.INCINEROAR, PokemonType.FIRE, PokemonType.DARK, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.POPPLIO, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BRIONNE, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.PRIMARINA, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PIKIPEK, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.TRUMBEAK, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.TOUCANNON, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.YUNGOOS, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GUMSHOOS, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GRUBBIN, PokemonType.BUG, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CHARJABUG, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.VIKAVOLT, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CRABRAWLER, PokemonType.FIGHTING, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CRABOMINABLE, PokemonType.FIGHTING, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ORICORIO, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CUTIEFLY, PokemonType.BUG, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.RIBOMBEE, PokemonType.BUG, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ROCKRUFF, PokemonType.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ]
    ]
    ],
    [ SpeciesId.LYCANROC, PokemonType.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ SpeciesId.WISHIWASHI, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MAREANIE, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.TOXAPEX, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MUDBRAY, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MUDSDALE, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DEWPIDER, PokemonType.WATER, PokemonType.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ARAQUANID, PokemonType.WATER, PokemonType.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FOMANTIS, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.LURANTIS, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MORELULL, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SHIINOTIC, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SALANDIT, PokemonType.POISON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SALAZZLE, PokemonType.POISON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.STUFFUL, PokemonType.NORMAL, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BEWEAR, PokemonType.NORMAL, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BOUNSWEET, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.STEENEE, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TSAREENA, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.COMFEY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ORANGURU, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PASSIMIAN, PokemonType.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.WIMPOD, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GOLISOPOD, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SANDYGAST, PokemonType.GHOST, PokemonType.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.PALOSSAND, PokemonType.GHOST, PokemonType.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PYUKUMUKU, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TYPE_NULL, PokemonType.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.SILVALLY, PokemonType.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MINIOR, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.KOMALA, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TURTONATOR, PokemonType.FIRE, PokemonType.DRAGON, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TOGEDEMARU, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MIMIKYU, PokemonType.GHOST, PokemonType.FAIRY, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BRUXISH, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DRAMPA, PokemonType.NORMAL, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DHELMISE, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.JANGMO_O, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HAKAMO_O, PokemonType.DRAGON, PokemonType.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.KOMMO_O, PokemonType.DRAGON, PokemonType.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TAPU_KOKO, PokemonType.ELECTRIC, PokemonType.FAIRY, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TAPU_LELE, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TAPU_BULU, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TAPU_FINI, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.COSMOG, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.COSMOEM, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.SOLGALEO, PokemonType.PSYCHIC, PokemonType.STEEL, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ SpeciesId.LUNALA, PokemonType.PSYCHIC, PokemonType.GHOST, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ SpeciesId.NIHILEGO, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.BUZZWOLE, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.PHEROMOSA, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.XURKITREE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CELESTEELA, PokemonType.STEEL, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.KARTANA, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GUZZLORD, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.SLUM, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.NECROZMA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.MAGEARNA, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MARSHADOW, PokemonType.FIGHTING, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.POIPOLE, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.NAGANADEL, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.STAKATAKA, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.BLACEPHALON, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ISLAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ZERAORA, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MELTAN, PokemonType.STEEL, -1, [ ]
    ],
    [ SpeciesId.MELMETAL, PokemonType.STEEL, -1, [ ]
    ],
    [ SpeciesId.GROOKEY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.THWACKEY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.RILLABOOM, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SCORBUNNY, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.RABOOT, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CINDERACE, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SOBBLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DRIZZILE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.INTELEON, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SKWOVET, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GREEDENT, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ROOKIDEE, PokemonType.FLYING, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CORVISQUIRE, PokemonType.FLYING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CORVIKNIGHT, PokemonType.FLYING, PokemonType.STEEL, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BLIPBUG, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.DOTTLER, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ORBEETLE, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.NICKIT, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.THIEVUL, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GOSSIFLEUR, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ELDEGOSS, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.WOOLOO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DUBWOOL, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CHEWTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DREDNAW, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.YAMPER, PokemonType.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.BOLTUND, PokemonType.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ROLYCOLY, PokemonType.ROCK, -1, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.CARKOL, PokemonType.ROCK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.COALOSSAL, PokemonType.ROCK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.APPLIN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FLAPPLE, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.APPLETUN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SILICOBRA, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SANDACONDA, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CRAMORANT, PokemonType.FLYING, PokemonType.WATER, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ARROKUDA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BARRASKEWDA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TOXEL, PokemonType.ELECTRIC, PokemonType.POISON, [ ]
    ],
    [ SpeciesId.TOXTRICITY, PokemonType.ELECTRIC, PokemonType.POISON, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.SIZZLIPEDE, PokemonType.FIRE, PokemonType.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CENTISKORCH, PokemonType.FIRE, PokemonType.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.CLOBBOPUS, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GRAPPLOCT, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SINISTEA, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.POLTEAGEIST, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.HATENNA, PokemonType.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.HATTREM, PokemonType.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.HATTERENE, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.IMPIDIMP, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MORGREM, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GRIMMSNARL, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.OBSTAGOON, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.PERRSERKER, PokemonType.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ SpeciesId.CURSOLA, PokemonType.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SIRFETCHD, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.MR_RIME, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.RUNERIGUS, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.MILCERY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ALCREMIE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FALINKS, PokemonType.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PINCURCHIN, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.SNOM, PokemonType.ICE, PokemonType.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.FROSMOTH, PokemonType.ICE, PokemonType.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.STONJOURNER, PokemonType.ROCK, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.EISCUE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.INDEEDEE, PokemonType.PSYCHIC, PokemonType.NORMAL, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.MORPEKO, PokemonType.ELECTRIC, PokemonType.DARK, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.CUFANT, PokemonType.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.COPPERAJAH, PokemonType.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.DRACOZOLT, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ARCTOZOLT, PokemonType.ELECTRIC, PokemonType.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DRACOVISH, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ARCTOVISH, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DURALUDON, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DREEPY, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.DRAKLOAK, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.DRAGAPULT, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ZACIAN, PokemonType.FAIRY, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.ZAMAZENTA, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.ETERNATUS, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.KUBFU, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.URSHIFU, PokemonType.FIGHTING, PokemonType.DARK, [
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ZARUDE, PokemonType.DARK, PokemonType.GRASS, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.REGIELEKI, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.REGIDRAGO, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GLASTRIER, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SPECTRIER, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CALYREX, PokemonType.PSYCHIC, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.WYRDEER, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.KLEAVOR, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.URSALUNA, PokemonType.GROUND, PokemonType.NORMAL, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BASCULEGION, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.SNEASLER, PokemonType.FIGHTING, PokemonType.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.OVERQWIL, PokemonType.DARK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ENAMORUS, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.SPRIGATITO, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.FLORAGATO, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.MEOWSCARADA, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.FUECOCO, PokemonType.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CROCALOR, PokemonType.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SKELEDIRGE, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.QUAXLY, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.QUAXWELL, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.QUAQUAVAL, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.LECHONK, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.OINKOLOGNE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TAROUNTULA, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SPIDOPS, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.NYMBLE, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.LOKIX, PokemonType.BUG, PokemonType.DARK, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.PAWMI, PokemonType.ELECTRIC, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PAWMO, PokemonType.ELECTRIC, PokemonType.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.PAWMOT, PokemonType.ELECTRIC, PokemonType.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TANDEMAUS, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.MAUSHOLD, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FIDOUGH, PokemonType.FAIRY, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.DACHSBUN, PokemonType.FAIRY, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SMOLIV, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.DOLLIV, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ARBOLIVA, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SQUAWKABILLY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.NACLI, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.NACLSTACK, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GARGANACL, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CHARCADET, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ARMAROUGE, PokemonType.FIRE, PokemonType.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CERULEDGE, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.TADBULB, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BELLIBOLT, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.WATTREL, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.KILOWATTREL, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.MASCHIFF, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.MABOSSTIFF, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.SHROODLE, PokemonType.POISON, PokemonType.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.GRAFAIAI, PokemonType.POISON, PokemonType.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.BRAMBLIN, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.BRAMBLEGHAST, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TOEDSCOOL, PokemonType.GROUND, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TOEDSCRUEL, PokemonType.GROUND, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.KLAWF, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.CAPSAKID, PokemonType.GRASS, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.SCOVILLAIN, PokemonType.GRASS, PokemonType.FIRE, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.RELLOR, PokemonType.BUG, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.RABSCA, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FLITTLE, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ESPATHRA, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.TINKATINK, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.TINKATUFF, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.TINKATON, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.WIGLETT, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.WUGTRIO, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BOMBIRDIER, PokemonType.FLYING, PokemonType.DARK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.FINIZEN, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PALAFIN, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.VAROOM, PokemonType.STEEL, PokemonType.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.REVAVROOM, PokemonType.STEEL, PokemonType.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.CYCLIZAR, PokemonType.DRAGON, PokemonType.NORMAL, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.ORTHWORM, PokemonType.STEEL, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.GLIMMET, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GLIMMORA, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GREAVARD, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.HOUNDSTONE, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.FLAMIGO, PokemonType.FLYING, PokemonType.FIGHTING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CETODDLE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.CETITAN, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.VELUZA, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.DONDOZO, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.TATSUGIRI, PokemonType.DRAGON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ANNIHILAPE, PokemonType.FIGHTING, PokemonType.GHOST, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.CLODSIRE, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.FARIGIRAF, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.DUDUNSPARCE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.KINGAMBIT, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GREAT_TUSK, PokemonType.GROUND, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SCREAM_TAIL, PokemonType.FAIRY, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.BRUTE_BONNET, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FLUTTER_MANE, PokemonType.GHOST, PokemonType.FAIRY, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SLITHER_WING, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.SANDY_SHOCKS, PokemonType.ELECTRIC, PokemonType.GROUND, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_TREADS, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_BUNDLE, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_HANDS, PokemonType.FIGHTING, PokemonType.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_JUGULIS, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_MOTH, PokemonType.FIRE, PokemonType.POISON, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.IRON_THORNS, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.FRIGIBAX, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ARCTIBAX, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.BAXCALIBUR, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.GIMMIGHOUL, PokemonType.GHOST, -1, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.GHOLDENGO, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.WO_CHIEN, PokemonType.DARK, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CHIEN_PAO, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.TING_LU, PokemonType.DARK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.CHI_YU, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ROARING_MOON, PokemonType.DRAGON, PokemonType.DARK, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.IRON_VALIANT, PokemonType.FAIRY, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ SpeciesId.KORAIDON, PokemonType.FIGHTING, PokemonType.DRAGON, [
      [ Biome.RUINS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.MIRAIDON, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.WALKING_WAKE, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.IRON_LEAVES, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.DIPPLIN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.POLTCHAGEIST, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.SINISTCHA, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.OKIDOGI, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.MUNKIDORI, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.FEZANDIPITI, PokemonType.POISON, PokemonType.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.OGERPON, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ SpeciesId.ARCHALUDON, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HYDRAPPLE, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GOUGING_FIRE, PokemonType.FIRE, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.RAGING_BOLT, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.IRON_BOULDER, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.IRON_CROWN, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.TERAPAGOS, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.PECHARUNT, PokemonType.POISON, PokemonType.GHOST, [ ]
    ],
    [ SpeciesId.ALOLA_RATTATA, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ALOLA_RATICATE, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ALOLA_RAICHU, PokemonType.ELECTRIC, PokemonType.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ALOLA_SANDSHREW, PokemonType.ICE, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ALOLA_SANDSLASH, PokemonType.ICE, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ALOLA_VULPIX, PokemonType.ICE, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ SpeciesId.ALOLA_NINETALES, PokemonType.ICE, PokemonType.FAIRY, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.ALOLA_DIGLETT, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ALOLA_DUGTRIO, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ALOLA_MEOWTH, PokemonType.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ALOLA_PERSIAN, PokemonType.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ALOLA_GEODUDE, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ALOLA_GRAVELER, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ALOLA_GOLEM, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ALOLA_GRIMER, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ SpeciesId.ALOLA_MUK, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ SpeciesId.ALOLA_EXEGGUTOR, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.ALOLA_MAROWAK, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.ETERNAL_FLOETTE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_MEOWTH, PokemonType.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ SpeciesId.GALAR_PONYTA, PokemonType.PSYCHIC, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ SpeciesId.GALAR_RAPIDASH, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ SpeciesId.GALAR_SLOWPOKE, PokemonType.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GALAR_SLOWBRO, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GALAR_FARFETCHD, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_WEEZING, PokemonType.POISON, PokemonType.FAIRY, [
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_MR_MIME, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_ARTICUNO, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_ZAPDOS, PokemonType.FIGHTING, PokemonType.FLYING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_MOLTRES, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_SLOWKING, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GALAR_CORSOLA, PokemonType.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.GALAR_ZIGZAGOON, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.GALAR_LINOONE, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.GALAR_DARUMAKA, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GALAR_DARMANITAN, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.GALAR_YAMASK, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.GALAR_STUNFISK, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_GROWLITHE, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_ARCANINE, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_VOLTORB, PokemonType.ELECTRIC, PokemonType.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_ELECTRODE, PokemonType.ELECTRIC, PokemonType.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_TYPHLOSION, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_QWILFISH, PokemonType.DARK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_SNEASEL, PokemonType.FIGHTING, PokemonType.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HISUI_SAMUROTT, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_LILLIGANT, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HISUI_ZORUA, PokemonType.NORMAL, PokemonType.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.HISUI_ZOROARK, PokemonType.NORMAL, PokemonType.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.HISUI_BRAVIARY, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HISUI_SLIGGOO, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HISUI_GOODRA, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.HISUI_AVALUGG, PokemonType.ICE, PokemonType.ROCK, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ SpeciesId.HISUI_DECIDUEYE, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ SpeciesId.PALDEA_TAUROS, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ SpeciesId.PALDEA_WOOPER, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ SpeciesId.BLOODMOON_URSALUNA, PokemonType.GROUND, PokemonType.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.SUPER_RARE, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, TimeOfDay.NIGHT ]
    ]
    ]
  ];

  const trainerBiomes = [
    [ TrainerType.ACE_TRAINER, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.ABYSS, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.ARTIST, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ]
    ]
    ],
    [ TrainerType.BACKERS, []],
    [ TrainerType.BACKPACKER, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.BAKER, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.BEAUTY, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.BIKER, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.BLACK_BELT, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.BEACH, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.BREEDER, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.CLERK, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.CYCLIST, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.DANCER, []],
    [ TrainerType.DEPOT_AGENT, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.DOCTOR, []],
    [ TrainerType.FIREBREATHER, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.FISHERMAN, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.GUITARIST, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.HARLEQUIN, []],
    [ TrainerType.HIKER, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.HOOLIGANS, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.HOOPSTER, []],
    [ TrainerType.INFIELDER, []],
    [ TrainerType.JANITOR, []],
    [ TrainerType.LINEBACKER, []],
    [ TrainerType.MAID, []],
    [ TrainerType.MUSICIAN, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.HEX_MANIAC, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.NURSERY_AIDE, []],
    [ TrainerType.OFFICER, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.PARASOL_LADY, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.PILOT, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.POKEFAN, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.PRESCHOOLER, []],
    [ TrainerType.PSYCHIC, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.RANGER, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.RICH, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.RICH_KID, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.ROUGHNECK, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SAILOR, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SCIENTIST, [
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SMASHER, []],
    [ TrainerType.SNOW_WORKER, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.STRIKER, []],
    [ TrainerType.SCHOOL_KID, [
      [ Biome.GRASS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SWIMMER, [
      [ Biome.SEA, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.TWINS, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.VETERAN, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.WAITER, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.WORKER, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.YOUNGSTER, [
      [ Biome.TOWN, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.BROCK, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MISTY, [
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.LT_SURGE, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ERIKA, [
      [ Biome.GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.JANINE, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.SABRINA, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.GIOVANNI, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BLAINE, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.FALKNER, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BUGSY, [
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.WHITNEY, [
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MORTY, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CHUCK, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.JASMINE, [
      [ Biome.FACTORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.PRYCE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CLAIR, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ROXANNE, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BRAWLY, [
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.WATTSON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.FLANNERY, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.NORMAN, [
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.WINONA, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.TATE, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.LIZA, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.JUAN, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ROARK, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.GARDENIA, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CRASHER_WAKE, [
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MAYLENE, [
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.FANTINA, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BYRON, [
      [ Biome.FACTORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CANDICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.VOLKNER, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CILAN, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CHILI, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CRESS, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CHEREN, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.LENORA, [
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ROXIE, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BURGH, [
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ELESA, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CLAY, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.SKYLA, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BRYCEN, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.DRAYDEN, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MARLON, [
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.VIOLA, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.GRANT, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.KORRINA, [
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.RAMOS, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.CLEMONT, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.VALERIE, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.OLYMPIA, [
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.WULFRIC, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MILO, [
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.NESSA, [
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.KABU, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BEA, [
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.ALLISTER, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.OPAL, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BEDE, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.GORDIE, [
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MELONY, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.PIERS, [
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.MARNIE, [
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.RAIHAN, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.KATY, [
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.BRASSIUS, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.IONO, [
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.KOFU, [
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.LARRY, [
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.RYME, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.TULIP, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.GRUSHA, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.LORELEI, []],
    [ TrainerType.BRUNO, []],
    [ TrainerType.AGATHA, []],
    [ TrainerType.LANCE, []],
    [ TrainerType.WILL, []],
    [ TrainerType.KOGA, []],
    [ TrainerType.KAREN, []],
    [ TrainerType.SIDNEY, []],
    [ TrainerType.PHOEBE, []],
    [ TrainerType.GLACIA, []],
    [ TrainerType.DRAKE, []],
    [ TrainerType.AARON, []],
    [ TrainerType.BERTHA, []],
    [ TrainerType.FLINT, []],
    [ TrainerType.LUCIAN, []],
    [ TrainerType.SHAUNTAL, []],
    [ TrainerType.MARSHAL, []],
    [ TrainerType.GRIMSLEY, []],
    [ TrainerType.CAITLIN, []],
    [ TrainerType.MALVA, []],
    [ TrainerType.SIEBOLD, []],
    [ TrainerType.WIKSTROM, []],
    [ TrainerType.DRASNA, []],
    [ TrainerType.HALA, []],
    [ TrainerType.MOLAYNE, []],
    [ TrainerType.OLIVIA, []],
    [ TrainerType.ACEROLA, []],
    [ TrainerType.KAHILI, []],
    [ TrainerType.RIKA, []],
    [ TrainerType.POPPY, []],
    [ TrainerType.LARRY_ELITE, []],
    [ TrainerType.HASSEL, []],
    [ TrainerType.CRISPIN, []],
    [ TrainerType.AMARYS, []],
    [ TrainerType.LACEY, []],
    [ TrainerType.DRAYTON, []],
    [ TrainerType.BLUE, []],
    [ TrainerType.RED, []],
    [ TrainerType.LANCE_CHAMPION, []],
    [ TrainerType.STEVEN, []],
    [ TrainerType.WALLACE, []],
    [ TrainerType.CYNTHIA, []],
    [ TrainerType.ALDER, []],
    [ TrainerType.IRIS, []],
    [ TrainerType.DIANTHA, []],
    [ TrainerType.HAU, []],
    [ TrainerType.GEETA, []],
    [ TrainerType.NEMONA, []],
    [ TrainerType.KIERAN, []],
    [ TrainerType.LEON, []],
    [ TrainerType.RIVAL, []]
  ];

  biomeDepths[Biome.TOWN] = [ 0, 1 ];

  const traverseBiome = (biome: Biome, depth: number) => {
    if (biome === Biome.END) {
      const biomeList = Object.keys(Biome).filter(key => !Number.isNaN(Number(key)));
      biomeList.pop(); // Removes Biome.END from the list
      const randIndex = randSeedInt(biomeList.length, 1); // Will never be Biome.TOWN
      biome = Biome[biomeList[randIndex]];
    }
    const linkedBiomes: (Biome | [ Biome, number ])[] = Array.isArray(biomeLinks[biome])
      ? biomeLinks[biome] as (Biome | [ Biome, number ])[]
      : [ biomeLinks[biome] as Biome ];
    for (const linkedBiomeEntry of linkedBiomes) {
      const linkedBiome = !Array.isArray(linkedBiomeEntry)
        ? linkedBiomeEntry as Biome
        : linkedBiomeEntry[0];
      const biomeChance = !Array.isArray(linkedBiomeEntry)
        ? 1
        : linkedBiomeEntry[1];
      if (!biomeDepths.hasOwnProperty(linkedBiome) || biomeChance < biomeDepths[linkedBiome][1] || (depth < biomeDepths[linkedBiome][0] && biomeChance === biomeDepths[linkedBiome][1])) {
        biomeDepths[linkedBiome] = [ depth + 1, biomeChance ];
        traverseBiome(linkedBiome, depth + 1);
      }
    }
  };

  traverseBiome(Biome.TOWN, 0);
  biomeDepths[Biome.END] = [ Object.values(biomeDepths).map(d => d[0]).reduce((max: number, value: number) => Math.max(max, value), 0) + 1, 1 ];

  for (const biome of getEnumValues(Biome)) {
    biomePokemonPools[biome] = {};
    biomeTrainerPools[biome] = {};

    for (const tier of getEnumValues(BiomePoolTier)) {
      biomePokemonPools[biome][tier] = {};
      biomeTrainerPools[biome][tier] = [];

      for (const tod of getEnumValues(TimeOfDay)) {
        biomePokemonPools[biome][tier][tod] = [];
      }
    }
  }

  for (const pb of pokemonBiomes) {
    const speciesId = pb[0] as SpeciesId;
    const biomeEntries = pb[3] as (Biome | BiomePoolTier)[][];

    const speciesEvolutions: SpeciesFormEvolution[] = pokemonEvolutions.hasOwnProperty(speciesId)
      ? pokemonEvolutions[speciesId]
      : [];

    if (!biomeEntries.filter(b => b[0] !== Biome.END).length && !speciesEvolutions.filter(es => !!((pokemonBiomes.find(p => p[0] === es.speciesId)!)[3] as any[]).filter(b => b[0] !== Biome.END).length).length) { // TODO: is the bang on the `find()` correct?
      uncatchableSpecies.push(speciesId);
    }

    // array of biome options for the current species
    catchableSpecies[speciesId] = [];

    for (const b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];
      const timesOfDay = b.length > 2
        ? Array.isArray(b[2])
          ? b[2]
          : [ b[2] ]
        : [ TimeOfDay.ALL ];

      catchableSpecies[speciesId].push({
        biome: biome as Biome,
        tier: tier as BiomePoolTier,
        tod: timesOfDay as TimeOfDay[]
      });

      for (const tod of timesOfDay) {
        if (!biomePokemonPools.hasOwnProperty(biome) || !biomePokemonPools[biome].hasOwnProperty(tier) || !biomePokemonPools[biome][tier].hasOwnProperty(tod)) {
          continue;
        }

        const biomeTierPool = biomePokemonPools[biome][tier][tod];

        let treeIndex = -1;
        let arrayIndex = 0;

        for (let t = 0; t < biomeTierPool.length; t++) {
          const existingSpeciesIds = biomeTierPool[t] as unknown as SpeciesId[];
          for (let es = 0; es < existingSpeciesIds.length; es++) {
            const existingSpeciesId = existingSpeciesIds[es];
            if (pokemonEvolutions.hasOwnProperty(existingSpeciesId) && (pokemonEvolutions[existingSpeciesId] as SpeciesFormEvolution[]).find(ese => ese.speciesId === speciesId)) {
              treeIndex = t;
              arrayIndex = es + 1;
              break;
            }
            if (speciesEvolutions?.find(se => se.speciesId === existingSpeciesId)) {
              treeIndex = t;
              arrayIndex = es;
              break;
            }
          }
          if (treeIndex > -1) {
            break;
          }
        }

        if (treeIndex > -1) {
          (biomeTierPool[treeIndex] as unknown as SpeciesId[]).splice(arrayIndex, 0, speciesId);
        } else {
          (biomeTierPool as unknown as SpeciesId[][]).push([ speciesId ]);
        }
      }
    }
  }

  for (const b of Object.keys(biomePokemonPools)) {
    for (const t of Object.keys(biomePokemonPools[b])) {
      const tier = Number.parseInt(t) as BiomePoolTier;
      for (const tod of Object.keys(biomePokemonPools[b][t])) {
        const biomeTierTimePool = biomePokemonPools[b][t][tod];
        for (let e = 0; e < biomeTierTimePool.length; e++) {
          const entry = biomeTierTimePool[e];
          if (entry.length === 1) {
            biomeTierTimePool[e] = entry[0];
          } else {
            const newEntry = {
              1: [ entry[0] ]
            };
            for (let s = 1; s < entry.length; s++) {
              const speciesId = entry[s];
              const prevolution = entry.flatMap((s: string | number) => pokemonEvolutions[s]).find(e => e && e.speciesId === speciesId);
              const level = prevolution.level - (prevolution.level === 1 ? 1 : 0) + (prevolution.wildDelay * 10) - (tier >= BiomePoolTier.BOSS ? 10 : 0);
              if (!newEntry.hasOwnProperty(level)) {
                newEntry[level] = [ speciesId ];
              } else {
                newEntry[level].push(speciesId);
              }
            }
            biomeTierTimePool[e] = newEntry;
          }
        }
      }
    }
  }

  for (const tb of trainerBiomes) {
    const trainerType = tb[0] as TrainerType;
    const biomeEntries = tb[1] as BiomePoolTier[][];

    for (const b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];

      if (!biomeTrainerPools.hasOwnProperty(biome) || !biomeTrainerPools[biome].hasOwnProperty(tier)) {
        continue;
      }

      const biomeTierPool = biomeTrainerPools[biome][tier];
      biomeTierPool.push(trainerType);
    }
    //outputPools();
  }


  // used in a commented code
  // function outputPools() {
  //   const pokemonOutput = {};
  //   const trainerOutput = {};

  //   for (const b of Object.keys(biomePokemonPools)) {
  //     const biome = Biome[b];
  //     pokemonOutput[biome] = {};
  //     trainerOutput[biome] = {};

  //     for (const t of Object.keys(biomePokemonPools[b])) {
  //       const tier = BiomePoolTier[t];

  //       pokemonOutput[biome][tier] = {};

  //       for (const tod of Object.keys(biomePokemonPools[b][t])) {
  //         const timeOfDay = TimeOfDay[tod];

  //         pokemonOutput[biome][tier][timeOfDay] = [];

  //         for (const f of biomePokemonPools[b][t][tod]) {
  //           if (typeof f === "number") {
  //             pokemonOutput[biome][tier][timeOfDay].push(Species[f]);
  //           } else {
  //             const tree = {};

  //             for (const l of Object.keys(f)) {
  //               tree[l] = f[l].map(s => Species[s]);
  //             }

  //             pokemonOutput[biome][tier][timeOfDay].push(tree);
  //           }
  //         }

  //       }
  //     }

  //     for (const t of Object.keys(biomeTrainerPools[b])) {
  //       const tier = BiomePoolTier[t];

  //       trainerOutput[biome][tier] = [];

  //       for (const f of biomeTrainerPools[b][t]) {
  //         trainerOutput[biome][tier].push(TrainerType[f]);
  //       }
  //     }
  //   }

  //   console.log(beautify(pokemonOutput, null, 2, 180).replace(/(        |        (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |(?:,|\[) (?:"\w+": \[ |(?:\{ )?"\d+": \[ )?)"(\w+)"(?= |,|\n)/g, "$1Species.$2").replace(/"(\d+)": /g, "$1: ").replace(/((?:      )|(?:(?!\n)    "(?:.*?)": \{) |\[(?: .*? )?\], )"(\w+)"/g, "$1[TimeOfDay.$2]").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[Biome.$2]"));
  //   console.log(beautify(trainerOutput, null, 2, 120).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, "$1TrainerType.$2").replace(/"(\d+)": /g, "$1: ").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[Biome.$2]"));
  // }

  /*for (let pokemon of allSpecies) {
    if (pokemon.speciesId >= Species.XERNEAS)
      break;
    pokemonBiomes[pokemon.speciesId - 1][0] = Species[pokemonBiomes[pokemon.speciesId - 1][0]];
    pokemonBiomes[pokemon.speciesId - 1][1] = Type[pokemonBiomes[pokemon.speciesId - 1][1]];
    if (pokemonBiomes[pokemon.speciesId - 1][2] > -1)
      pokemonBiomes[pokemon.speciesId - 1][2] = Type[pokemonBiomes[pokemon.speciesId - 1][2]];
    for (let b of Utils.getEnumValues(Biome)) {
      if (biomePools.hasOwnProperty(b)) {
        let poolTier = -1;
        for (let t of Object.keys(biomePools[b])) {
          for (let p = 0; p < biomePools[b][t].length; p++) {
            if (biomePools[b][t][p] === pokemon.speciesId) {
              poolTier = parseInt(t) as BiomePoolTier;
              break;
            }
          }
        }
        if (poolTier > -1)
          pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], BiomePoolTier[poolTier] ]);
      } else if (biomePoolPredicates[b](pokemon)) {
        pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], BiomePoolTier[BiomePoolTier.COMMON] ]);
      }
    }
  }

  console.log(JSON.stringify(pokemonBiomes, null, '  '));*/
}
