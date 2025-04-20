import { PokemonType } from "#enums/pokemon-type";
import { randSeedInt, getEnumValues } from "#app/utils/common";
import type { SpeciesFormEvolution } from "#app/data/balance/pokemon-evolutions";
import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import i18next from "i18next";
import { Biome } from "#enums/biome";
import { Species } from "#enums/species";
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

export const uncatchableSpecies: Species[] = [];

export interface SpeciesTree {
  [key: number]: Species[]
}

export interface PokemonPools {
  [key: number]: (Species | SpeciesTree)[]
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
        { 1: [ Species.CATERPIE ], 7: [ Species.METAPOD ]},
        Species.SENTRET,
        Species.LEDYBA,
        Species.HOPPIP,
        Species.SUNKERN,
        Species.STARLY,
        Species.PIDOVE,
        Species.COTTONEE,
        { 1: [ Species.SCATTERBUG ], 9: [ Species.SPEWPA ]},
        Species.YUNGOOS,
        Species.SKWOVET
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.CATERPIE ], 7: [ Species.METAPOD ]},
        Species.SENTRET,
        Species.HOPPIP,
        Species.SUNKERN,
        Species.SILCOON,
        Species.STARLY,
        Species.PIDOVE,
        Species.COTTONEE,
        { 1: [ Species.SCATTERBUG ], 9: [ Species.SPEWPA ]},
        Species.YUNGOOS,
        Species.SKWOVET
      ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.WEEDLE ], 7: [ Species.KAKUNA ]}, Species.POOCHYENA, Species.PATRAT, Species.PURRLOIN, Species.BLIPBUG ],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.WEEDLE ], 7: [ Species.KAKUNA ]}, Species.HOOTHOOT, Species.SPINARAK, Species.POOCHYENA, Species.CASCOON, Species.PATRAT, Species.PURRLOIN, Species.BLIPBUG ],
      [TimeOfDay.ALL]: [ Species.PIDGEY, Species.RATTATA, Species.SPEAROW, Species.ZIGZAGOON, Species.WURMPLE, Species.TAILLOW, Species.BIDOOF, Species.LILLIPUP, Species.FLETCHLING, Species.WOOLOO, Species.LECHONK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.BELLSPROUT, Species.POOCHYENA, Species.LOTAD, Species.SKITTY, Species.COMBEE, Species.CHERUBI, Species.PATRAT, Species.MINCCINO, Species.PAWMI ],
      [TimeOfDay.DAY]: [ Species.NIDORAN_F, Species.NIDORAN_M, Species.BELLSPROUT, Species.POOCHYENA, Species.LOTAD, Species.SKITTY, Species.COMBEE, Species.CHERUBI, Species.PATRAT, Species.MINCCINO, Species.PAWMI ],
      [TimeOfDay.DUSK]: [ Species.EKANS, Species.ODDISH, Species.MEOWTH, Species.SPINARAK, Species.SEEDOT, Species.SHROOMISH, Species.KRICKETOT, Species.VENIPEDE ],
      [TimeOfDay.NIGHT]: [ Species.EKANS, Species.ODDISH, Species.PARAS, Species.VENONAT, Species.MEOWTH, Species.SEEDOT, Species.SHROOMISH, Species.KRICKETOT, Species.VENIPEDE ],
      [TimeOfDay.ALL]: [ Species.NINCADA, Species.WHISMUR, Species.FIDOUGH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [ Species.TANDEMAUS ], [TimeOfDay.DAY]: [ Species.TANDEMAUS ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ABRA, Species.SURSKIT, Species.ROOKIDEE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.EEVEE, Species.RALTS ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.PLAINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.SENTRET ], 15: [ Species.FURRET ]}, { 1: [ Species.YUNGOOS ], 30: [ Species.GUMSHOOS ]}, { 1: [ Species.SKWOVET ], 24: [ Species.GREEDENT ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.SENTRET ], 15: [ Species.FURRET ]}, { 1: [ Species.YUNGOOS ], 30: [ Species.GUMSHOOS ]}, { 1: [ Species.SKWOVET ], 24: [ Species.GREEDENT ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.MEOWTH ], 28: [ Species.PERSIAN ]}, { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.ZUBAT ], 22: [ Species.GOLBAT ]}, { 1: [ Species.MEOWTH ], 28: [ Species.PERSIAN ]}, { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ]}, { 1: [ Species.BIDOOF ], 15: [ Species.BIBAREL ]}, { 1: [ Species.LECHONK ], 18: [ Species.OINKOLOGNE ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.DODUO ], 31: [ Species.DODRIO ]},
        { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ]},
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ]},
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ]},
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.DODUO ], 31: [ Species.DODRIO ]},
        { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ]},
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ]},
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ]},
        { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ]},
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ]},
        { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ]},
        Species.PIKACHU,
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ Species.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ Species.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.ABRA ], 16: [ Species.KADABRA ]}, { 1: [ Species.BUNEARY ], 20: [ Species.LOPUNNY ]}, { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FARFETCHD, Species.LICKITUNG, Species.CHANSEY, Species.EEVEE, Species.SNORLAX, { 1: [ Species.DUNSPARCE ], 62: [ Species.DUDUNSPARCE ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.LATIAS, Species.LATIOS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.DODRIO, Species.FURRET, Species.GUMSHOOS, Species.GREEDENT ],
      [TimeOfDay.DAY]: [ Species.DODRIO, Species.FURRET, Species.GUMSHOOS, Species.GREEDENT ],
      [TimeOfDay.DUSK]: [ Species.PERSIAN, Species.MIGHTYENA ],
      [TimeOfDay.NIGHT]: [ Species.PERSIAN, Species.MIGHTYENA ],
      [TimeOfDay.ALL]: [ Species.LINOONE, Species.BIBAREL, Species.LOPUNNY, Species.OINKOLOGNE ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.PAWMOT, Species.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ Species.LYCANROC, Species.PAWMOT, Species.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.FARFETCHD, Species.SNORLAX, Species.LICKILICKY, Species.DUDUNSPARCE ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LATIAS, Species.LATIOS ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.HOPPIP ], 18: [ Species.SKIPLOOM ]}, Species.SUNKERN, Species.COTTONEE, Species.PETILIL ],
      [TimeOfDay.DAY]: [{ 1: [ Species.HOPPIP ], 18: [ Species.SKIPLOOM ]}, Species.SUNKERN, Species.COTTONEE, Species.PETILIL ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ]}, { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ]}, { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ]}],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ]}, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ]}, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.BULBASAUR ], 16: [ Species.IVYSAUR ], 32: [ Species.VENUSAUR ]}, Species.GROWLITHE, { 1: [ Species.TURTWIG ], 18: [ Species.GROTLE ], 32: [ Species.TORTERRA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUDOWOODO ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VIRIZION ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ], [TimeOfDay.DAY]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VENUSAUR, Species.SUDOWOODO, Species.TORTERRA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VIRIZION ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.BOUNSWEET ], 18: [ Species.STEENEE ], 58: [ Species.TSAREENA ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.NIDORAN_F ], 16: [ Species.NIDORINA ]}, { 1: [ Species.NIDORAN_M ], 16: [ Species.NIDORINO ]}, { 1: [ Species.BOUNSWEET ], 18: [ Species.STEENEE ], 58: [ Species.TSAREENA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.ODDISH ], 21: [ Species.GLOOM ]}, { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.ODDISH ], 21: [ Species.GLOOM ]}, { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.NINCADA ], 20: [ Species.NINJASK ]}, { 1: [ Species.FOMANTIS ], 44: [ Species.LURANTIS ]}, { 1: [ Species.NYMBLE ], 24: [ Species.LOKIX ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.PARAS ], 24: [ Species.PARASECT ]}, { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ]}, { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ]}],
      [TimeOfDay.ALL]: [ Species.VULPIX ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.PINSIR, { 1: [ Species.CHIKORITA ], 16: [ Species.BAYLEEF ], 32: [ Species.MEGANIUM ]}, { 1: [ Species.GIRAFARIG ], 62: [ Species.FARIGIRAF ]}, Species.ZANGOOSE, Species.KECLEON, Species.TROPIUS ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SCYTHER, Species.SHEDINJA, Species.ROTOM ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.TSAREENA ],
      [TimeOfDay.DAY]: [ Species.NIDOQUEEN, Species.NIDOKING, Species.TSAREENA ],
      [TimeOfDay.DUSK]: [ Species.VILEPLUME, Species.KRICKETUNE ],
      [TimeOfDay.NIGHT]: [ Species.VILEPLUME, Species.KRICKETUNE ],
      [TimeOfDay.ALL]: [ Species.NINJASK, Species.ZANGOOSE, Species.KECLEON, Species.LURANTIS, Species.LOKIX ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.BELLOSSOM ], [TimeOfDay.DAY]: [ Species.BELLOSSOM ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.PINSIR, Species.MEGANIUM, Species.FARIGIRAF ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.YAMPER ], 25: [ Species.BOLTUND ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.YAMPER ], 25: [ Species.BOLTUND ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ]}, { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.RATTATA ], 20: [ Species.RATICATE ]}, { 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ]}, { 1: [ Species.LILLIPUP ], 16: [ Species.HERDIER ], 32: [ Species.STOUTLAND ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}, Species.INDEEDEE ],
      [TimeOfDay.DAY]: [{ 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}, Species.INDEEDEE ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.ESPURR ], 25: [ Species.MEOWSTIC ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.ESPURR ], 25: [ Species.MEOWSTIC ]}],
      [TimeOfDay.ALL]: [ Species.PIKACHU, { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ]}, Species.FURFROU, { 1: [ Species.FIDOUGH ], 26: [ Species.DACHSBUN ]}, Species.SQUAWKABILLY ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.TANDEMAUS ], 25: [ Species.MAUSHOLD ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.TANDEMAUS ], 25: [ Species.MAUSHOLD ]}],
      [TimeOfDay.DUSK]: [ Species.MORPEKO ],
      [TimeOfDay.NIGHT]: [ Species.MORPEKO ],
      [TimeOfDay.ALL]: [{ 1: [ Species.VAROOM ], 40: [ Species.REVAVROOM ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.EEVEE, Species.SMEARGLE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CASTFORM ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.BOLTUND ], [TimeOfDay.DAY]: [ Species.BOLTUND ], [TimeOfDay.DUSK]: [ Species.MEOWSTIC ], [TimeOfDay.NIGHT]: [ Species.MEOWSTIC ], [TimeOfDay.ALL]: [ Species.STOUTLAND, Species.FURFROU, Species.DACHSBUN ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.MAUSHOLD ], [TimeOfDay.DAY]: [ Species.MAUSHOLD ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CASTFORM, Species.REVAVROOM ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        Species.BUTTERFREE,
        { 1: [ Species.BELLSPROUT ], 21: [ Species.WEEPINBELL ]},
        { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ]},
        Species.PETILIL,
        { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ]},
        Species.VIVILLON
      ],
      [TimeOfDay.DAY]: [
        Species.BUTTERFREE,
        { 1: [ Species.BELLSPROUT ], 21: [ Species.WEEPINBELL ]},
        Species.BEAUTIFLY,
        { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ]},
        Species.PETILIL,
        { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ]},
        Species.VIVILLON
      ],
      [TimeOfDay.DUSK]: [
        Species.BEEDRILL,
        { 1: [ Species.PINECO ], 31: [ Species.FORRETRESS ]},
        { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ]},
        { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ]},
        { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ]}
      ],
      [TimeOfDay.NIGHT]: [
        Species.BEEDRILL,
        { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ]},
        { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ]},
        { 1: [ Species.PINECO ], 31: [ Species.FORRETRESS ]},
        Species.DUSTOX,
        { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ]},
        { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ]},
        { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ]}
      ],
      [TimeOfDay.ALL]: [{ 1: [ Species.TAROUNTULA ], 15: [ Species.SPIDOPS ]}, { 1: [ Species.NYMBLE ], 24: [ Species.LOKIX ]}, { 1: [ Species.SHROODLE ], 28: [ Species.GRAFAIAI ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.ROSELIA, Species.MOTHIM, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ]}],
      [TimeOfDay.DAY]: [ Species.ROSELIA, Species.MOTHIM, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ]}, { 1: [ Species.DOTTLER ], 30: [ Species.ORBEETLE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.HOOTHOOT ], 20: [ Species.NOCTOWL ]}, { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ]}, { 1: [ Species.DOTTLER ], 30: [ Species.ORBEETLE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.EKANS ], 22: [ Species.ARBOK ]},
        { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]},
        { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ]},
        { 1: [ Species.PANSAGE ], 30: [ Species.SIMISAGE ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ Species.EXEGGCUTE, Species.STANTLER ],
      [TimeOfDay.DAY]: [ Species.EXEGGCUTE, Species.STANTLER ],
      [TimeOfDay.DUSK]: [ Species.SCYTHER ],
      [TimeOfDay.NIGHT]: [ Species.SCYTHER ],
      [TimeOfDay.ALL]: [
        Species.HERACROSS,
        { 1: [ Species.TREECKO ], 16: [ Species.GROVYLE ], 36: [ Species.SCEPTILE ]},
        Species.TROPIUS,
        Species.KARRABLAST,
        Species.SHELMET,
        { 1: [ Species.CHESPIN ], 16: [ Species.QUILLADIN ], 36: [ Species.CHESNAUGHT ]},
        { 1: [ Species.ROWLET ], 17: [ Species.DARTRIX ], 34: [ Species.DECIDUEYE ]},
        Species.SQUAWKABILLY,
        { 1: [ Species.TOEDSCOOL ], 30: [ Species.TOEDSCRUEL ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.BLOODMOON_URSALUNA ], [TimeOfDay.ALL]: [ Species.DURANT ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KARTANA, Species.WO_CHIEN ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.VICTREEBEL, Species.MOTHIM, Species.VESPIQUEN, Species.LILLIGANT, Species.SAWSBUCK ],
      [TimeOfDay.DAY]: [ Species.VICTREEBEL, Species.BEAUTIFLY, Species.MOTHIM, Species.VESPIQUEN, Species.LILLIGANT, Species.SAWSBUCK ],
      [TimeOfDay.DUSK]: [ Species.ARIADOS, Species.FORRETRESS, Species.SHIFTRY, Species.BRELOOM, Species.SCOLIPEDE, Species.ORBEETLE ],
      [TimeOfDay.NIGHT]: [ Species.VENOMOTH, Species.NOCTOWL, Species.ARIADOS, Species.FORRETRESS, Species.DUSTOX, Species.SHIFTRY, Species.BRELOOM, Species.SCOLIPEDE, Species.ORBEETLE ],
      [TimeOfDay.ALL]: [ Species.WORMADAM, Species.SIMISAGE, Species.SPIDOPS, Species.LOKIX, Species.GRAFAIAI ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.STANTLER ],
      [TimeOfDay.DAY]: [ Species.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.LYCANROC, Species.BLOODMOON_URSALUNA ],
      [TimeOfDay.ALL]: [ Species.HERACROSS, Species.SCEPTILE, Species.ESCAVALIER, Species.ACCELGOR, Species.DURANT, Species.CHESNAUGHT, Species.DECIDUEYE, Species.TOEDSCRUEL ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KARTANA, Species.WO_CHIEN ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CALYREX ]}
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ]}, { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ]}, Species.CRAMORANT, { 1: [ Species.FINIZEN ], 38: [ Species.PALAFIN ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ]}, { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ]}, Species.CRAMORANT, { 1: [ Species.FINIZEN ], 38: [ Species.PALAFIN ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.INKAY ], 30: [ Species.MALAMAR ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.FINNEON ], 31: [ Species.LUMINEON ]}, { 1: [ Species.INKAY ], 30: [ Species.MALAMAR ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ]}, { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ]}, { 1: [ Species.BUIZEL ], 26: [ Species.FLOATZEL ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.STARYU ], 30: [ Species.STARMIE ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.STARYU ], 30: [ Species.STARMIE ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ]}, Species.SHELLDER, { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ]}, Species.SHELLDER, { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ]}, { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ]},
        { 1: [ Species.HORSEA ], 32: [ Species.SEADRA ]},
        { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ]},
        { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ]},
        { 1: [ Species.PANPOUR ], 30: [ Species.SIMIPOUR ]},
        { 1: [ Species.WATTREL ], 25: [ Species.KILOWATTREL ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.LAPRAS, { 1: [ Species.PIPLUP ], 16: [ Species.PRINPLUP ], 36: [ Species.EMPOLEON ]}, { 1: [ Species.POPPLIO ], 17: [ Species.BRIONNE ], 34: [ Species.PRIMARINA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KINGDRA, Species.ROTOM, { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.PELIPPER, Species.CRAMORANT, Species.PALAFIN ],
      [TimeOfDay.DAY]: [ Species.PELIPPER, Species.CRAMORANT, Species.PALAFIN ],
      [TimeOfDay.DUSK]: [ Species.SHARPEDO, Species.MALAMAR ],
      [TimeOfDay.NIGHT]: [ Species.SHARPEDO, Species.LUMINEON, Species.MALAMAR ],
      [TimeOfDay.ALL]: [ Species.TENTACRUEL, Species.FLOATZEL, Species.SIMIPOUR, Species.KILOWATTREL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KINGDRA, Species.EMPOLEON, Species.PRIMARINA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LUGIA ]}
  },
  [Biome.SWAMP]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ]}, { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ]}, { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.EKANS ], 22: [ Species.ARBOK ]}, { 1: [ Species.PALDEA_WOOPER ], 20: [ Species.CLODSIRE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.EKANS ], 22: [ Species.ARBOK ]}, { 1: [ Species.PALDEA_WOOPER ], 20: [ Species.CLODSIRE ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ]},
        { 1: [ Species.GULPIN ], 26: [ Species.SWALOT ]},
        { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ]},
        { 1: [ Species.TYMPOLE ], 25: [ Species.PALPITOAD ], 36: [ Species.SEISMITOAD ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.EKANS ], 22: [ Species.ARBOK ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.EKANS ], 22: [ Species.ARBOK ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ]},
        { 1: [ Species.BARBOACH ], 30: [ Species.WHISCASH ]},
        { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ]},
        Species.STUNFISK,
        { 1: [ Species.MAREANIE ], 38: [ Species.TOXAPEX ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.TOTODILE ], 18: [ Species.CROCONAW ], 30: [ Species.FERALIGATR ]}, { 1: [ Species.MUDKIP ], 16: [ Species.MARSHTOMP ], 36: [ Species.SWAMPERT ]}]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.GALAR_SLOWPOKE ], 40: [ Species.GALAR_SLOWBRO ]}, { 1: [ Species.HISUI_SLIGGOO ], 80: [ Species.HISUI_GOODRA ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.GALAR_SLOWPOKE ], 40: [ Species.GALAR_SLOWBRO ]}, { 1: [ Species.HISUI_SLIGGOO ], 80: [ Species.HISUI_GOODRA ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.POLITOED, Species.GALAR_STUNFISK ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AZELF, Species.POIPOLE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.QUAGSIRE, Species.LUDICOLO ],
      [TimeOfDay.DAY]: [ Species.QUAGSIRE, Species.LUDICOLO ],
      [TimeOfDay.DUSK]: [ Species.ARBOK, Species.CLODSIRE ],
      [TimeOfDay.NIGHT]: [ Species.ARBOK, Species.CLODSIRE ],
      [TimeOfDay.ALL]: [ Species.POLIWRATH, Species.SWALOT, Species.WHISCASH, Species.GASTRODON, Species.SEISMITOAD, Species.STUNFISK, Species.TOXAPEX ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.GALAR_SLOWBRO, Species.GALAR_SLOWKING, Species.HISUI_GOODRA ],
      [TimeOfDay.DAY]: [ Species.GALAR_SLOWBRO, Species.GALAR_SLOWKING, Species.HISUI_GOODRA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.FERALIGATR, Species.POLITOED, Species.SWAMPERT, Species.GALAR_STUNFISK ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AZELF, Species.NAGANADEL ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.STARYU ], 30: [ Species.STARMIE ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.STARYU ], 30: [ Species.STARMIE ]}],
      [TimeOfDay.DUSK]: [ Species.SHELLDER ],
      [TimeOfDay.NIGHT]: [ Species.SHELLDER ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.KRABBY ], 28: [ Species.KINGLER ]},
        { 1: [ Species.CORPHISH ], 30: [ Species.CRAWDAUNT ]},
        { 1: [ Species.DWEBBLE ], 34: [ Species.CRUSTLE ]},
        { 1: [ Species.BINACLE ], 39: [ Species.BARBARACLE ]},
        { 1: [ Species.MAREANIE ], 38: [ Species.TOXAPEX ]},
        { 1: [ Species.WIGLETT ], 26: [ Species.WUGTRIO ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.BURMY ], 20: [ Species.WORMADAM ]}, { 1: [ Species.CLAUNCHER ], 37: [ Species.CLAWITZER ]}, { 1: [ Species.SANDYGAST ], 42: [ Species.PALOSSAND ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.QUAXLY ], 16: [ Species.QUAXWELL ], 36: [ Species.QUAQUAVAL ]}, Species.TATSUGIRI ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRESSELIA, Species.KELDEO, Species.TAPU_FINI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.STARMIE ],
      [TimeOfDay.DAY]: [ Species.STARMIE ],
      [TimeOfDay.DUSK]: [ Species.CLOYSTER ],
      [TimeOfDay.NIGHT]: [ Species.CLOYSTER ],
      [TimeOfDay.ALL]: [ Species.KINGLER, Species.CRAWDAUNT, Species.WORMADAM, Species.CRUSTLE, Species.BARBARACLE, Species.CLAWITZER, Species.TOXAPEX, Species.PALOSSAND ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CARRACOSTA, Species.QUAQUAVAL ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRESSELIA, Species.KELDEO, Species.TAPU_FINI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ]}, { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ]}, { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ]},
        { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ]},
        { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ]},
        { 1: [ Species.CHEWTLE ], 22: [ Species.DREDNAW ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.DEWPIDER ], 22: [ Species.ARAQUANID ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.DEWPIDER ], 22: [ Species.ARAQUANID ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ]}, { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ]}, { 1: [ Species.SURSKIT ], 22: [ Species.MASQUERAIN ]}, Species.WISHIWASHI, Species.FLAMIGO ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SQUIRTLE ], 16: [ Species.WARTORTLE ], 36: [ Species.BLASTOISE ]},
        { 1: [ Species.OSHAWOTT ], 17: [ Species.DEWOTT ], 36: [ Species.SAMUROTT ]},
        { 1: [ Species.FROAKIE ], 16: [ Species.FROGADIER ], 36: [ Species.GRENINJA ]},
        { 1: [ Species.SOBBLE ], 16: [ Species.DRIZZILE ], 35: [ Species.INTELEON ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VAPOREON, Species.SLOWKING ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUICUNE, Species.MESPRIT ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SWANNA, Species.ARAQUANID ],
      [TimeOfDay.DAY]: [ Species.SWANNA, Species.ARAQUANID ],
      [TimeOfDay.DUSK]: [ Species.AZUMARILL ],
      [TimeOfDay.NIGHT]: [ Species.AZUMARILL ],
      [TimeOfDay.ALL]: [ Species.GOLDUCK, Species.SLOWBRO, Species.SEAKING, Species.GYARADOS, Species.MASQUERAIN, Species.WISHIWASHI, Species.DREDNAW ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLASTOISE, Species.VAPOREON, Species.SLOWKING, Species.SAMUROTT, Species.GRENINJA, Species.INTELEON ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUICUNE, Species.MESPRIT ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ]},
        Species.REMORAID,
        Species.CLAMPERL,
        Species.BASCULIN,
        { 1: [ Species.FRILLISH ], 40: [ Species.JELLICENT ]},
        { 1: [ Species.ARROKUDA ], 26: [ Species.BARRASKEWDA ]},
        Species.VELUZA
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ]},
        Species.SHELLDER,
        { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ]},
        Species.LUVDISC,
        { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ]},
        { 1: [ Species.SKRELP ], 48: [ Species.DRAGALGE ]},
        Species.PINCURCHIN,
        Species.DONDOZO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, { 1: [ Species.MANTYKE ], 52: [ Species.MANTINE ]}, Species.ALOMOMOLA, { 1: [ Species.TYNAMO ], 39: [ Species.EELEKTRIK ]}, Species.DHELMISE ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.OMANYTE ], 40: [ Species.OMASTAR ]},
        { 1: [ Species.KABUTO ], 40: [ Species.KABUTOPS ]},
        Species.RELICANTH,
        Species.PYUKUMUKU,
        { 1: [ Species.GALAR_CORSOLA ], 38: [ Species.CURSOLA ]},
        Species.ARCTOVISH,
        Species.HISUI_QWILFISH
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FEEBAS, Species.NIHILEGO ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.LANTURN, Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, Species.MANTINE, Species.WAILORD, Species.HUNTAIL, Species.GOREBYSS, Species.LUVDISC, Species.JELLICENT, Species.ALOMOMOLA, Species.DRAGALGE, Species.BARRASKEWDA, Species.DONDOZO ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.OMASTAR, Species.KABUTOPS, Species.RELICANTH, Species.EELEKTROSS, Species.PYUKUMUKU, Species.DHELMISE, Species.CURSOLA, Species.ARCTOVISH, Species.BASCULEGION, Species.OVERQWIL ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MILOTIC, Species.NIHILEGO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KYOGRE ]}
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ]},
        { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ]},
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ]},
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ]},
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ]},
        { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ]},
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ]},
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ]},
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]}, { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ]}, { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]}, { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ]}, { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ]}, { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ]}, { 1: [ Species.SKIDDO ], 32: [ Species.GOGOAT ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]},
        { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ]},
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]},
        { 1: [ Species.RUFFLET ], 54: [ Species.BRAVIARY ]},
        { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ]},
        { 1: [ Species.FLITTLE ], 35: [ Species.ESPATHRA ]},
        Species.BOMBIRDIER
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]},
        { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ]},
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]},
        { 1: [ Species.RUFFLET ], 54: [ Species.BRAVIARY ]},
        { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ]},
        { 1: [ Species.FLITTLE ], 35: [ Species.ESPATHRA ]},
        Species.BOMBIRDIER
      ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.VULLABY ], 54: [ Species.MANDIBUZZ ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.VULLABY ], 54: [ Species.MANDIBUZZ ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ]},
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ]},
        { 1: [ Species.NATU ], 25: [ Species.XATU ]},
        { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ]},
        { 1: [ Species.NACLI ], 24: [ Species.NACLSTACK ], 38: [ Species.GARGANACL ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.MURKROW ],
      [TimeOfDay.ALL]: [ Species.SKARMORY, { 1: [ Species.TORCHIC ], 16: [ Species.COMBUSKEN ], 36: [ Species.BLAZIKEN ]}, { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ]}, Species.HAWLUCHA, Species.KLAWF ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ]},
        { 1: [ Species.CRANIDOS ], 30: [ Species.RAMPARDOS ]},
        { 1: [ Species.SHIELDON ], 30: [ Species.BASTIODON ]},
        { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ]},
        Species.ROTOM,
        Species.ARCHEOPS,
        { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ]}
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TORNADUS, Species.TING_LU, Species.OGERPON ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SWELLOW, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.TALONFLAME, Species.CORVIKNIGHT, Species.ESPATHRA ],
      [TimeOfDay.DAY]: [ Species.SWELLOW, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.TALONFLAME, Species.CORVIKNIGHT, Species.ESPATHRA ],
      [TimeOfDay.DUSK]: [ Species.MANDIBUZZ ],
      [TimeOfDay.NIGHT]: [ Species.MANDIBUZZ ],
      [TimeOfDay.ALL]: [ Species.PIDGEOT, Species.FEAROW, Species.SKARMORY, Species.AGGRON, Species.GOGOAT, Species.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.HISUI_BRAVIARY ], [TimeOfDay.DAY]: [ Species.HISUI_BRAVIARY ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLAZIKEN, Species.RAMPARDOS, Species.BASTIODON, Species.HAWLUCHA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM, Species.TORNADUS, Species.TING_LU, Species.OGERPON ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HO_OH ]}
  },
  [Biome.BADLANDS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.DIGLETT ], 26: [ Species.DUGTRIO ]},
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ]},
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]},
        { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ]},
        { 1: [ Species.MUDBRAY ], 30: [ Species.MUDSDALE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.SIZZLIPEDE ], 28: [ Species.CENTISKORCH ]}, { 1: [ Species.CAPSAKID ], 30: [ Species.SCOVILLAIN ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.SIZZLIPEDE ], 28: [ Species.CENTISKORCH ]}, { 1: [ Species.CAPSAKID ], 30: [ Species.SCOVILLAIN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ]},
        { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ]},
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]},
        { 1: [ Species.CUFANT ], 34: [ Species.COPPERAJAH ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ONIX, Species.GLIGAR, { 1: [ Species.POLTCHAGEIST ], 30: [ Species.SINISTCHA ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LANDORUS, Species.OKIDOGI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.DONPHAN, Species.CENTISKORCH, Species.SCOVILLAIN ],
      [TimeOfDay.DAY]: [ Species.DONPHAN, Species.CENTISKORCH, Species.SCOVILLAIN ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.MAROWAK ],
      [TimeOfDay.ALL]: [ Species.DUGTRIO, Species.GOLEM, Species.RHYPERIOR, Species.GLISCOR, Species.EXCADRILL, Species.MUDSDALE, Species.COPPERAJAH ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.STEELIX, Species.SINISTCHA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LANDORUS, Species.OKIDOGI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GROUDON ]}
  },
  [Biome.CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.ZUBAT ], 22: [ Species.GOLBAT ]},
        { 1: [ Species.PARAS ], 24: [ Species.PARASECT ]},
        { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]},
        { 1: [ Species.WHISMUR ], 20: [ Species.LOUDRED ], 40: [ Species.EXPLOUD ]},
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ]},
        { 1: [ Species.WOOBAT ], 20: [ Species.SWOOBAT ]},
        { 1: [ Species.BUNNELBY ], 20: [ Species.DIGGERSBY ]},
        { 1: [ Species.NACLI ], 24: [ Species.NACLSTACK ], 38: [ Species.GARGANACL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ]}],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ]},
        { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ]},
        Species.NOSEPASS,
        { 1: [ Species.NOIBAT ], 48: [ Species.NOIVERN ]},
        { 1: [ Species.WIMPOD ], 30: [ Species.GOLISOPOD ]}
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.ONIX, { 1: [ Species.FERROSEED ], 40: [ Species.FERROTHORN ]}, Species.CARBINK, { 1: [ Species.GLIMMET ], 35: [ Species.GLIMMORA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHUCKLE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UXIE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.PARASECT, Species.ONIX, Species.CROBAT, Species.URSARING, Species.EXPLOUD, Species.PROBOPASS, Species.GIGALITH, Species.SWOOBAT, Species.DIGGERSBY, Species.NOIVERN, Species.GOLISOPOD, Species.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.LYCANROC ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHUCKLE, Species.FERROTHORN, Species.GLIMMORA ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UXIE ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERAPAGOS ]}
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ Species.TRAPINCH, { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ]}, { 1: [ Species.RELLOR ], 29: [ Species.RABSCA ]}],
      [TimeOfDay.DAY]: [ Species.TRAPINCH, { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ]}, { 1: [ Species.RELLOR ], 29: [ Species.RABSCA ]}],
      [TimeOfDay.DUSK]: [{ 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ]}, { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ]}, { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ]}, { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ]}, { 1: [ Species.SILICOBRA ], 36: [ Species.SANDACONDA ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ]}, Species.HELIOPTILE ],
      [TimeOfDay.DAY]: [{ 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ]}, Species.HELIOPTILE ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.MARACTUS, { 1: [ Species.BRAMBLIN ], 30: [ Species.BRAMBLEGHAST ]}, Species.ORTHWORM ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.DARUMAKA ], 35: [ Species.DARMANITAN ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.LILEEP ], 40: [ Species.CRADILY ]}, { 1: [ Species.ANORITH ], 40: [ Species.ARMALDO ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIROCK, Species.TAPU_BULU, Species.PHEROMOSA ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.HIPPOWDON, Species.HELIOLISK, Species.RABSCA ],
      [TimeOfDay.DAY]: [ Species.HIPPOWDON, Species.HELIOLISK, Species.RABSCA ],
      [TimeOfDay.DUSK]: [ Species.CACTURNE, Species.KROOKODILE ],
      [TimeOfDay.NIGHT]: [ Species.CACTURNE, Species.KROOKODILE ],
      [TimeOfDay.ALL]: [ Species.SANDSLASH, Species.DRAPION, Species.DARMANITAN, Species.MARACTUS, Species.SANDACONDA, Species.BRAMBLEGHAST ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRADILY, Species.ARMALDO ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIROCK, Species.TAPU_BULU, Species.PHEROMOSA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SEEL ], 34: [ Species.DEWGONG ]},
        { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ]},
        { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ]},
        { 1: [ Species.VANILLITE ], 35: [ Species.VANILLISH ], 47: [ Species.VANILLUXE ]},
        { 1: [ Species.CUBCHOO ], 37: [ Species.BEARTIC ]},
        { 1: [ Species.BERGMITE ], 37: [ Species.AVALUGG ]},
        Species.CRABRAWLER,
        { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.SNEASEL,
        { 1: [ Species.SNORUNT ], 42: [ Species.GLALIE ]},
        { 1: [ Species.SPHEAL ], 32: [ Species.SEALEO ], 44: [ Species.WALREIN ]},
        Species.EISCUE,
        { 1: [ Species.CETODDLE ], 30: [ Species.CETITAN ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JYNX, Species.LAPRAS, Species.FROSLASS, Species.CRYOGONAL ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DELIBIRD, Species.ROTOM, { 1: [ Species.AMAURA ], 59: [ Species.AURORUS ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARTICUNO, Species.REGICE ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.DEWGONG, Species.GLALIE, Species.WALREIN, Species.WEAVILE, Species.MAMOSWINE, Species.FROSLASS, Species.VANILLUXE, Species.BEARTIC, Species.CRYOGONAL, Species.AVALUGG, Species.CRABOMINABLE, Species.CETITAN ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JYNX, Species.LAPRAS, Species.GLACEON, Species.AURORUS ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARTICUNO, Species.REGICE, Species.ROTOM ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KYUREM ]}
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.LEDYBA ], 18: [ Species.LEDIAN ]}, Species.ROSELIA, Species.COTTONEE, Species.MINCCINO ],
      [TimeOfDay.DAY]: [ Species.ROSELIA, Species.COTTONEE, Species.MINCCINO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ]},
        { 1: [ Species.FLABEBE ], 19: [ Species.FLOETTE ]},
        { 1: [ Species.CUTIEFLY ], 25: [ Species.RIBOMBEE ]},
        { 1: [ Species.GOSSIFLEUR ], 20: [ Species.ELDEGOSS ]},
        { 1: [ Species.WOOLOO ], 24: [ Species.DUBWOOL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ]},
        { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ]},
        { 1: [ Species.SKITTY ], 30: [ Species.DELCATTY ]},
        Species.BOUFFALANT,
        { 1: [ Species.SMOLIV ], 25: [ Species.DOLLIV ], 35: [ Species.ARBOLIVA ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ]},
        { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ]},
        { 1: [ Species.SKITTY ], 30: [ Species.DELCATTY ]},
        Species.BOUFFALANT,
        { 1: [ Species.SMOLIV ], 25: [ Species.DOLLIV ], 35: [ Species.ARBOLIVA ]}
      ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ]},
        { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ], 30: [ Species.AMPHAROS ]},
        { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ]},
        { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ]},
        Species.ORICORIO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.VOLBEAT, Species.ILLUMISE ],
      [TimeOfDay.ALL]: [ Species.TAUROS, Species.EEVEE, Species.MILTANK, Species.SPINDA, { 1: [ Species.APPLIN ], 30: [ Species.DIPPLIN ]}, { 1: [ Species.SPRIGATITO ], 16: [ Species.FLORAGATO ], 36: [ Species.MEOWSCARADA ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CHANSEY, Species.SYLVEON ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MELOETTA ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.LEDIAN, Species.GRANBULL, Species.DELCATTY, Species.ROSERADE, Species.CINCCINO, Species.BOUFFALANT, Species.ARBOLIVA ],
      [TimeOfDay.DAY]: [ Species.GRANBULL, Species.DELCATTY, Species.ROSERADE, Species.CINCCINO, Species.BOUFFALANT, Species.ARBOLIVA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.TAUROS, Species.MILTANK, Species.GARDEVOIR, Species.PURUGLY, Species.ZEBSTRIKA, Species.FLORGES, Species.RIBOMBEE, Species.DUBWOOL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.HISUI_LILLIGANT ], [TimeOfDay.DAY]: [ Species.HISUI_LILLIGANT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLISSEY, Species.SYLVEON, Species.FLAPPLE, Species.APPLETUN, Species.MEOWSCARADA, Species.HYDRAPPLE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MELOETTA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHAYMIN ]}
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.PIKACHU,
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ]},
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ]},
        { 1: [ Species.ELECTRIKE ], 26: [ Species.MANECTRIC ]},
        { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ]},
        Species.DEDENNE,
        { 1: [ Species.GRUBBIN ], 20: [ Species.CHARJABUG ]},
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ]},
        { 1: [ Species.TADBULB ], 30: [ Species.BELLIBOLT ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ELECTABUZZ, Species.PLUSLE, Species.MINUN, Species.PACHIRISU, Species.EMOLGA, Species.TOGEDEMARU ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JOLTEON, Species.HISUI_VOLTORB ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.RAICHU, Species.MANECTRIC, Species.LUXRAY, Species.MAGNEZONE, Species.ELECTIVIRE, Species.DEDENNE, Species.VIKAVOLT, Species.TOGEDEMARU, Species.PAWMOT, Species.BELLIBOLT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JOLTEON, Species.AMPHAROS, Species.HISUI_ELECTRODE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZAPDOS, Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZEKROM ]}
  },
  [Biome.VOLCANO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.VULPIX,
        Species.GROWLITHE,
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ]},
        { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ]},
        { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ]},
        { 1: [ Species.SALANDIT ], 33: [ Species.SALAZZLE ]},
        { 1: [ Species.ROLYCOLY ], 18: [ Species.CARKOL ], 34: [ Species.COALOSSAL ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MAGMAR, Species.TORKOAL, { 1: [ Species.PANSEAR ], 30: [ Species.SIMISEAR ]}, Species.HEATMOR, Species.TURTONATOR ]},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CHARMANDER ], 16: [ Species.CHARMELEON ], 36: [ Species.CHARIZARD ]},
        { 1: [ Species.CYNDAQUIL ], 14: [ Species.QUILAVA ], 36: [ Species.TYPHLOSION ]},
        { 1: [ Species.CHIMCHAR ], 14: [ Species.MONFERNO ], 36: [ Species.INFERNAPE ]},
        { 1: [ Species.TEPIG ], 17: [ Species.PIGNITE ], 36: [ Species.EMBOAR ]},
        { 1: [ Species.FENNEKIN ], 16: [ Species.BRAIXEN ], 36: [ Species.DELPHOX ]},
        { 1: [ Species.LITTEN ], 17: [ Species.TORRACAT ], 34: [ Species.INCINEROAR ]},
        { 1: [ Species.SCORBUNNY ], 16: [ Species.RABOOT ], 35: [ Species.CINDERACE ]},
        { 1: [ Species.CHARCADET ], 30: [ Species.ARMAROUGE ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FLAREON, Species.ROTOM, { 1: [ Species.LARVESTA ], 59: [ Species.VOLCARONA ]}, Species.HISUI_GROWLITHE ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ENTEI, Species.HEATRAN, Species.VOLCANION, Species.CHI_YU ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.NINETALES, Species.ARCANINE, Species.RAPIDASH, Species.MAGCARGO, Species.CAMERUPT, Species.TORKOAL, Species.MAGMORTAR, Species.SIMISEAR, Species.HEATMOR, Species.SALAZZLE, Species.TURTONATOR, Species.COALOSSAL ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.CHARIZARD, Species.FLAREON, Species.TYPHLOSION, Species.INFERNAPE, Species.EMBOAR, Species.VOLCARONA, Species.DELPHOX, Species.INCINEROAR, Species.CINDERACE, Species.ARMAROUGE, Species.HISUI_ARCANINE ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MOLTRES, Species.ENTEI, Species.ROTOM, Species.HEATRAN, Species.VOLCANION, Species.CHI_YU ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.RESHIRAM ]}
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ]},
        { 1: [ Species.SHUPPET ], 37: [ Species.BANETTE ]},
        { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ]},
        { 1: [ Species.DRIFLOON ], 28: [ Species.DRIFBLIM ]},
        { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ]},
        Species.PHANTUMP,
        Species.PUMPKABOO,
        { 1: [ Species.GREAVARD ], 60: [ Species.HOUNDSTONE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ]}, { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ]}, { 1: [ Species.SINISTEA ], 30: [ Species.POLTEAGEIST ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MISDREAVUS, Species.MIMIKYU, { 1: [ Species.FUECOCO ], 16: [ Species.CROCALOR ], 36: [ Species.SKELEDIRGE ]}, Species.CERULEDGE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SPIRITOMB ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MARSHADOW, Species.SPECTRIER ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.MAROWAK ],
      [TimeOfDay.DAY]: [ Species.MAROWAK ],
      [TimeOfDay.DUSK]: [ Species.MAROWAK ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.GENGAR, Species.BANETTE, Species.DRIFBLIM, Species.MISMAGIUS, Species.DUSKNOIR, Species.CHANDELURE, Species.TREVENANT, Species.GOURGEIST, Species.MIMIKYU, Species.POLTEAGEIST, Species.HOUNDSTONE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SKELEDIRGE, Species.CERULEDGE, Species.HISUI_TYPHLOSION ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MARSHADOW, Species.SPECTRIER ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GIRATINA ]}
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ]},
        { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ]},
        { 1: [ Species.MEDITITE ], 37: [ Species.MEDICHAM ]},
        { 1: [ Species.STUFFUL ], 27: [ Species.BEWEAR ]},
        { 1: [ Species.CLOBBOPUS ], 55: [ Species.GRAPPLOCT ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ]}, { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ]}, { 1: [ Species.MIENFOO ], 50: [ Species.MIENSHAO ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.LUCARIO, Species.THROH, Species.SAWK, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONTOP, Species.GALLADE, Species.GALAR_FARFETCHD ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERRAKION, Species.KUBFU, Species.GALAR_ZAPDOS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.HARIYAMA, Species.MEDICHAM, Species.LUCARIO, Species.TOXICROAK, Species.THROH, Species.SAWK, Species.SCRAFTY, Species.MIENSHAO, Species.BEWEAR, Species.GRAPPLOCT, Species.ANNIHILAPE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONTOP, Species.GALLADE, Species.PANGORO, Species.SIRFETCHD, Species.HISUI_DECIDUEYE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERRAKION, Species.URSHIFU ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZAMAZENTA, Species.GALAR_ZAPDOS ]}
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ]},
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ]},
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ]},
        { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ]},
        { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ]}, Species.KLEFKI ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GENESECT, Species.MAGEARNA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KLINKLANG, Species.KLEFKI ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GENESECT, Species.MAGEARNA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.RUINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.DROWZEE ], 26: [ Species.HYPNO ]},
        { 1: [ Species.NATU ], 25: [ Species.XATU ]},
        Species.UNOWN,
        { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ]},
        { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ]},
        { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.ABRA ], 16: [ Species.KADABRA ]}, Species.SIGILYPH, { 1: [ Species.TINKATINK ], 24: [ Species.TINKATUFF ], 38: [ Species.TINKATON ]}]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MR_MIME, Species.WOBBUFFET, { 1: [ Species.GOTHITA ], 32: [ Species.GOTHORITA ], 41: [ Species.GOTHITELLE ]}, Species.STONJOURNER ]},
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ Species.ESPEON ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.GALAR_YAMASK ], 34: [ Species.RUNERIGUS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.GALAR_YAMASK ], 34: [ Species.RUNERIGUS ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.ARCHEN ], 37: [ Species.ARCHEOPS ]}]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGISTEEL, Species.FEZANDIPITI ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ALAKAZAM, Species.HYPNO, Species.XATU, Species.GRUMPIG, Species.CLAYDOL, Species.SIGILYPH, Species.GOTHITELLE, Species.BEHEEYEM, Species.TINKATON ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.ESPEON ], [TimeOfDay.DUSK]: [ Species.RUNERIGUS ], [TimeOfDay.NIGHT]: [ Species.RUNERIGUS ], [TimeOfDay.ALL]: [ Species.MR_MIME, Species.WOBBUFFET, Species.ARCHEOPS ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGISTEEL, Species.FEZANDIPITI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KORAIDON ]}
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ]},
        { 1: [ Species.GOOMY ], 40: [ Species.SLIGGOO ], 80: [ Species.GOODRA ]},
        { 1: [ Species.JANGMO_O ], 35: [ Species.HAKAMO_O ], 45: [ Species.KOMMO_O ]}
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ]},
        { 1: [ Species.GOOMY ], 40: [ Species.SLIGGOO ], 80: [ Species.GOODRA ]},
        { 1: [ Species.JANGMO_O ], 35: [ Species.HAKAMO_O ], 45: [ Species.KOMMO_O ]}
      ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ]},
        { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ]},
        { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ], 48: [ Species.HAXORUS ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ]}, Species.DRAMPA, Species.CYCLIZAR ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.DREEPY ], 50: [ Species.DRAKLOAK ], 60: [ Species.DRAGAPULT ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.DREEPY ], 50: [ Species.DRAKLOAK ], 60: [ Species.DRAGAPULT ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.DRATINI ], 30: [ Species.DRAGONAIR ], 55: [ Species.DRAGONITE ]}, { 1: [ Species.FRIGIBAX ], 35: [ Species.ARCTIBAX ], 54: [ Species.BAXCALIBUR ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AERODACTYL, Species.DRUDDIGON, { 1: [ Species.TYRUNT ], 59: [ Species.TYRANTRUM ]}, Species.DRACOZOLT, Species.DRACOVISH ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIDRAGO ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SALAMENCE, Species.GOODRA, Species.KOMMO_O ],
      [TimeOfDay.DAY]: [ Species.SALAMENCE, Species.GOODRA, Species.KOMMO_O ],
      [TimeOfDay.DUSK]: [ Species.TYRANITAR, Species.DRAGAPULT ],
      [TimeOfDay.NIGHT]: [ Species.TYRANITAR, Species.DRAGAPULT ],
      [TimeOfDay.ALL]: [ Species.DRAGONITE, Species.FLYGON, Species.GARCHOMP, Species.HAXORUS, Species.DRAMPA, Species.BAXCALIBUR ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AERODACTYL, Species.DRUDDIGON, Species.TYRANTRUM, Species.DRACOZOLT, Species.DRACOVISH ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIDRAGO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIALGA ]}
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.MURKROW,
        { 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ]},
        Species.SABLEYE,
        { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ]},
        { 1: [ Species.PAWNIARD ], 52: [ Species.BISHARP ], 64: [ Species.KINGAMBIT ]},
        { 1: [ Species.NICKIT ], 18: [ Species.THIEVUL ]},
        { 1: [ Species.IMPIDIMP ], 32: [ Species.MORGREM ], 42: [ Species.GRIMMSNARL ]},
        { 1: [ Species.MASCHIFF ], 30: [ Species.MABOSSTIFF ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.ABSOL, Species.SPIRITOMB, { 1: [ Species.ZORUA ], 30: [ Species.ZOROARK ]}, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UMBREON ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DARKRAI, Species.GALAR_MOLTRES ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.HOUNDOOM, Species.SABLEYE, Species.ABSOL, Species.HONCHKROW, Species.SPIRITOMB, Species.LIEPARD, Species.ZOROARK, Species.HYDREIGON, Species.THIEVUL, Species.GRIMMSNARL, Species.MABOSSTIFF, Species.KINGAMBIT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UMBREON, Species.HISUI_SAMUROTT ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DARKRAI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.PALKIA, Species.YVELTAL, Species.GALAR_MOLTRES ]}
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ Species.SOLROCK ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.LUNATONE ],
      [TimeOfDay.ALL]: [ Species.CLEFAIRY, { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ]}, { 1: [ Species.MUNNA ], 30: [ Species.MUSHARNA ]}, Species.MINIOR ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ]}, { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ]}]},
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [{ 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ]}, Species.SIGILYPH, { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ]}]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.COSMOG ], 43: [ Species.COSMOEM ]}, Species.CELESTEELA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.SOLROCK ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.LUNATONE ], [TimeOfDay.ALL]: [ Species.CLEFABLE, Species.BRONZONG, Species.MUSHARNA, Species.REUNICLUS, Species.MINIOR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.METAGROSS, Species.PORYGON_Z ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CELESTEELA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.SOLGALEO ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.LUNALA ], [TimeOfDay.ALL]: [ Species.RAYQUAZA, Species.NECROZMA ]}
  },
  [Biome.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ]},
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ]},
        { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ]},
        { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ]},
        { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ]},
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ]},
        { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [{ 1: [ Species.GALAR_MEOWTH ], 28: [ Species.PERRSERKER ]}], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ONIX, Species.HITMONLEE, Species.HITMONCHAN, Species.DURALUDON ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.HITMONTOP ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.COBALION, Species.STAKATAKA ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MACHAMP, Species.CONKELDURR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.PERRSERKER ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARCHALUDON ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.COBALION, Species.STAKATAKA ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.JUNGLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ Species.VESPIQUEN, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ]}, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ]}],
      [TimeOfDay.DAY]: [ Species.VESPIQUEN, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ]}, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ]}],
      [TimeOfDay.DUSK]: [ Species.SHROOMISH, { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ]}, { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ]}, Species.SHROOMISH, { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ]}, { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}],
      [TimeOfDay.ALL]: [ Species.AIPOM, { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ]}, { 1: [ Species.PIKIPEK ], 14: [ Species.TRUMBEAK ], 28: [ Species.TOUCANNON ]}]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.EXEGGCUTE, Species.TROPIUS, Species.COMBEE, Species.KOMALA ],
      [TimeOfDay.DAY]: [ Species.EXEGGCUTE, Species.TROPIUS, Species.COMBEE, Species.KOMALA ],
      [TimeOfDay.DUSK]: [ Species.TANGELA, { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ]}, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ]}],
      [TimeOfDay.NIGHT]: [ Species.TANGELA, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PANSAGE ], 30: [ Species.SIMISAGE ]},
        { 1: [ Species.PANSEAR ], 30: [ Species.SIMISEAR ]},
        { 1: [ Species.PANPOUR ], 30: [ Species.SIMIPOUR ]},
        { 1: [ Species.JOLTIK ], 36: [ Species.GALVANTULA ]},
        { 1: [ Species.LITLEO ], 35: [ Species.PYROAR ]},
        { 1: [ Species.FOMANTIS ], 44: [ Species.LURANTIS ]},
        Species.FALINKS
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}, Species.PASSIMIAN, { 1: [ Species.GALAR_PONYTA ], 40: [ Species.GALAR_RAPIDASH ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ]}, Species.PASSIMIAN ],
      [TimeOfDay.DUSK]: [ Species.ORANGURU ],
      [TimeOfDay.NIGHT]: [ Species.ORANGURU ],
      [TimeOfDay.ALL]: [
        Species.SCYTHER,
        Species.YANMA,
        { 1: [ Species.SLAKOTH ], 18: [ Species.VIGOROTH ], 36: [ Species.SLAKING ]},
        Species.SEVIPER,
        Species.CARNIVINE,
        { 1: [ Species.SNIVY ], 17: [ Species.SERVINE ], 36: [ Species.SERPERIOR ]},
        { 1: [ Species.GROOKEY ], 16: [ Species.THWACKEY ], 35: [ Species.RILLABOOM ]}
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KANGASKHAN, Species.CHATOT, Species.KLEAVOR ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TAPU_LELE, Species.BUZZWOLE, Species.ZARUDE, Species.MUNKIDORI ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.EXEGGUTOR, Species.TROPIUS, Species.CHERRIM, Species.LEAVANNY, Species.KOMALA ],
      [TimeOfDay.DAY]: [ Species.EXEGGUTOR, Species.TROPIUS, Species.CHERRIM, Species.LEAVANNY, Species.KOMALA ],
      [TimeOfDay.DUSK]: [ Species.BRELOOM, Species.TANGROWTH, Species.AMOONGUSS, Species.PANGORO ],
      [TimeOfDay.NIGHT]: [ Species.BRELOOM, Species.TANGROWTH, Species.AMOONGUSS, Species.PANGORO ],
      [TimeOfDay.ALL]: [ Species.SEVIPER, Species.AMBIPOM, Species.CARNIVINE, Species.YANMEGA, Species.GALVANTULA, Species.PYROAR, Species.TOUCANNON, Species.LURANTIS, Species.FALINKS ]
    },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.AMOONGUSS, Species.GALAR_RAPIDASH ],
      [TimeOfDay.DAY]: [ Species.AMOONGUSS ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.KANGASKHAN, Species.SCIZOR, Species.SLAKING, Species.LEAFEON, Species.SERPERIOR, Species.RILLABOOM ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TAPU_LELE, Species.BUZZWOLE, Species.ZARUDE, Species.MUNKIDORI ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KLEAVOR ]}
  },
  [Biome.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ]},
        { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ]},
        Species.MAWILE,
        { 1: [ Species.SPRITZEE ], 40: [ Species.AROMATISSE ]},
        { 1: [ Species.SWIRLIX ], 40: [ Species.SLURPUFF ]},
        { 1: [ Species.CUTIEFLY ], 25: [ Species.RIBOMBEE ]},
        { 1: [ Species.MORELULL ], 24: [ Species.SHIINOTIC ]},
        { 1: [ Species.MILCERY ], 30: [ Species.ALCREMIE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.CLEFAIRY,
        Species.TOGETIC,
        { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ]},
        Species.CARBINK,
        Species.COMFEY,
        { 1: [ Species.HATENNA ], 32: [ Species.HATTREM ], 42: [ Species.HATTERENE ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AUDINO, Species.ETERNAL_FLOETTE ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIANCIE, Species.ENAMORUS ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.WIGGLYTUFF, Species.MAWILE, Species.TOGEKISS, Species.AUDINO, Species.AROMATISSE, Species.SLURPUFF, Species.CARBINK, Species.RIBOMBEE, Species.SHIINOTIC, Species.COMFEY, Species.HATTERENE, Species.ALCREMIE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ETERNAL_FLOETTE ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIANCIE, Species.ENAMORUS ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.XERNEAS ]}
  },
  [Biome.TEMPLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ]},
        { 1: [ Species.NATU ], 25: [ Species.XATU ]},
        { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ]},
        { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ]},
        { 1: [ Species.GOLETT ], 43: [ Species.GOLURK ]},
        { 1: [ Species.HONEDGE ], 35: [ Species.DOUBLADE ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ]},
        { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ]},
        { 1: [ Species.CHINGLING ], 20: [ Species.CHIMECHO ]},
        { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ]},
        { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ]}
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.GIMMIGHOUL ], 40: [ Species.GHOLDENGO ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HOOPA, Species.TAPU_KOKO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CHIMECHO, Species.COFAGRIGUS, Species.GOLURK, Species.AEGISLASH ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GHOLDENGO ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HOOPA, Species.TAPU_KOKO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIGIGAS ]}
  },
  [Biome.SLUM]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ]}],
      [TimeOfDay.ALL]: [
        { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ]},
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ]},
        { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ]},
        { 1: [ Species.TRUBBISH ], 36: [ Species.GARBODOR ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.BURMY ], 20: [ Species.WORMADAM ]}]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ Species.TOXTRICITY, { 1: [ Species.GALAR_LINOONE ], 65: [ Species.OBSTAGOON ]}, Species.GALAR_ZIGZAGOON ],
      [TimeOfDay.NIGHT]: [ Species.TOXTRICITY, { 1: [ Species.GALAR_LINOONE ], 65: [ Species.OBSTAGOON ]}, Species.GALAR_ZIGZAGOON ],
      [TimeOfDay.ALL]: [{ 1: [ Species.VAROOM ], 40: [ Species.REVAVROOM ]}]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GUZZLORD ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.SKUNTANK, Species.WATCHOG ], [TimeOfDay.NIGHT]: [ Species.SKUNTANK, Species.WATCHOG ], [TimeOfDay.ALL]: [ Species.MUK, Species.WEEZING, Species.WORMADAM, Species.GARBODOR ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.TOXTRICITY, Species.OBSTAGOON ], [TimeOfDay.NIGHT]: [ Species.TOXTRICITY, Species.OBSTAGOON ], [TimeOfDay.ALL]: [ Species.REVAVROOM, Species.GALAR_WEEZING ]},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GUZZLORD ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]}, { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ]}],
      [TimeOfDay.NIGHT]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]}, { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ]}, { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ]}, Species.EISCUE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]}, Species.STANTLER ],
      [TimeOfDay.DAY]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ]}, Species.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [{ 1: [ Species.GALAR_DARUMAKA ], 30: [ Species.GALAR_DARMANITAN ]}],
      [TimeOfDay.DAY]: [{ 1: [ Species.GALAR_DARUMAKA ], 30: [ Species.GALAR_DARMANITAN ]}],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.DELIBIRD, { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ]}, { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ]}]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ Species.HISUI_SNEASEL ],
      [TimeOfDay.DAY]: [ Species.HISUI_SNEASEL ],
      [TimeOfDay.DUSK]: [{ 1: [ Species.HISUI_ZORUA ], 30: [ Species.HISUI_ZOROARK ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.HISUI_ZORUA ], 30: [ Species.HISUI_ZOROARK ]}],
      [TimeOfDay.ALL]: [{ 1: [ Species.GALAR_MR_MIME ], 42: [ Species.MR_RIME ]}, Species.ARCTOZOLT, Species.HISUI_AVALUGG ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GLASTRIER, Species.CHIEN_PAO, Species.GALAR_ARTICUNO ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.WYRDEER ], [TimeOfDay.DAY]: [ Species.WYRDEER ], [TimeOfDay.DUSK]: [ Species.FROSMOTH ], [TimeOfDay.NIGHT]: [ Species.FROSMOTH ], [TimeOfDay.ALL]: [ Species.ABOMASNOW, Species.URSALUNA ]},
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.SNEASLER, Species.GALAR_DARMANITAN ],
      [TimeOfDay.DAY]: [ Species.SNEASLER, Species.GALAR_DARMANITAN ],
      [TimeOfDay.DUSK]: [ Species.HISUI_ZOROARK ],
      [TimeOfDay.NIGHT]: [ Species.HISUI_ZOROARK ],
      [TimeOfDay.ALL]: [ Species.MR_RIME, Species.ARCTOZOLT, Species.ALOLA_SANDSLASH, Species.ALOLA_NINETALES ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GLASTRIER, Species.CHIEN_PAO ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZACIAN, Species.GALAR_ARTICUNO ]}
  },
  [Biome.ISLAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [{ 1: [ Species.ALOLA_RATTATA ], 30: [ Species.ALOLA_RATICATE ]}, { 1: [ Species.ALOLA_MEOWTH ], 30: [ Species.ALOLA_PERSIAN ]}],
      [TimeOfDay.NIGHT]: [{ 1: [ Species.ALOLA_RATTATA ], 30: [ Species.ALOLA_RATICATE ]}, { 1: [ Species.ALOLA_MEOWTH ], 30: [ Species.ALOLA_PERSIAN ]}],
      [TimeOfDay.ALL]: [
        Species.ORICORIO,
        { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ]},
        { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ]},
        { 1: [ Species.ALOLA_DIGLETT ], 26: [ Species.ALOLA_DUGTRIO ]},
        { 1: [ Species.ALOLA_GEODUDE ], 25: [ Species.ALOLA_GRAVELER ], 40: [ Species.ALOLA_GOLEM ]},
        { 1: [ Species.ALOLA_GRIMER ], 38: [ Species.ALOLA_MUK ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ Species.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ Species.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ Species.BRUXISH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLACEPHALON ]},
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ Species.ALOLA_RATICATE, Species.ALOLA_PERSIAN, Species.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ Species.ALOLA_RATICATE, Species.ALOLA_PERSIAN, Species.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ Species.ORICORIO, Species.BRUXISH, Species.ALOLA_SANDSLASH, Species.ALOLA_NINETALES, Species.ALOLA_DUGTRIO, Species.ALOLA_GOLEM, Species.ALOLA_MUK ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLACEPHALON ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []}
  },
  [Biome.LABORATORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ]},
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ]},
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ]},
        { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ]},
        { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ]}
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [{ 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ]}]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, { 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ]}]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ]},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TYPE_NULL ]},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MUK, Species.ELECTRODE, Species.BRONZONG, Species.MAGNEZONE, Species.PORYGON_Z, Species.REUNICLUS, Species.KLINKLANG ]},
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM, Species.ZYGARDE, Species.SILVALLY ]},
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MEWTWO, Species.MIRAIDON ]}
  },
  [Biome.END]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.GREAT_TUSK,
        Species.SCREAM_TAIL,
        Species.BRUTE_BONNET,
        Species.FLUTTER_MANE,
        Species.SLITHER_WING,
        Species.SANDY_SHOCKS,
        Species.IRON_TREADS,
        Species.IRON_BUNDLE,
        Species.IRON_HANDS,
        Species.IRON_JUGULIS,
        Species.IRON_MOTH,
        Species.IRON_THORNS
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROARING_MOON, Species.IRON_VALIANT ]},
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.WALKING_WAKE, Species.IRON_LEAVES, Species.GOUGING_FIRE, Species.RAGING_BOLT, Species.IRON_BOULDER, Species.IRON_CROWN ]},
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: []},
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ETERNATUS ]},
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
    [ Species.BULBASAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IVYSAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VENUSAUR, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CHARMANDER, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHARMELEON, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHARIZARD, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SQUIRTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.WARTORTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BLASTOISE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CATERPIE, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.METAPOD, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BUTTERFREE, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.WEEDLE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.KAKUNA, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.BEEDRILL, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PIDGEY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PIDGEOTTO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PIDGEOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.RATTATA, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RATICATE, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SPEAROW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FEAROW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.EKANS, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ARBOK, PokemonType.POISON, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PIKACHU, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RAICHU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SANDSHREW, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDSLASH, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NIDORAN_F, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORINA, PokemonType.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDOQUEEN, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORAN_M, PokemonType.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORINO, PokemonType.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDOKING, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.CLEFAIRY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CLEFABLE, PokemonType.FAIRY, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VULPIX, PokemonType.FIRE, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NINETALES, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.JIGGLYPUFF, PokemonType.NORMAL, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WIGGLYTUFF, PokemonType.NORMAL, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ZUBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ODDISH, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.GLOOM, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.VILEPLUME, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PARAS, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PARASECT, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VENONAT, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.VENOMOTH, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.DIGLETT, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUGTRIO, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEOWTH, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PERSIAN, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PSYDUCK, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLDUCK, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MANKEY, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PRIMEAPE, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GROWLITHE, PokemonType.FIRE, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ARCANINE, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.POLIWAG, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.POLIWHIRL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.POLIWRATH, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ABRA, PokemonType.PSYCHIC, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KADABRA, PokemonType.PSYCHIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ALAKAZAM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MACHOP, PokemonType.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MACHOKE, PokemonType.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MACHAMP, PokemonType.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BELLSPROUT, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.WEEPINBELL, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VICTREEBEL, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TENTACOOL, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TENTACRUEL, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GEODUDE, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GRAVELER, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLEM, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PONYTA, PokemonType.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RAPIDASH, PokemonType.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SLOWPOKE, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SLOWBRO, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGNEMITE, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAGNETON, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FARFETCHD, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DODUO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.DODRIO, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SEEL, PokemonType.WATER, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DEWGONG, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GRIMER, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUK, PokemonType.POISON, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHELLDER, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CLOYSTER, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.GASTLY, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HAUNTER, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GENGAR, PokemonType.GHOST, PokemonType.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ONIX, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DROWZEE, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HYPNO, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KRABBY, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KINGLER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VOLTORB, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ELECTRODE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.EXEGGCUTE, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.EXEGGUTOR, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CUBONE, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MAROWAK, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY, TimeOfDay.DUSK ]]
    ]
    ],
    [ Species.HITMONLEE, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.HITMONCHAN, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.LICKITUNG, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.KOFFING, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WEEZING, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.RHYHORN, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.RHYDON, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CHANSEY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TANGELA, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.KANGASKHAN, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HORSEA, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEADRA, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLDEEN, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEAKING, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.STARYU, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.STARMIE, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.MR_MIME, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SCYTHER, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.JYNX, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ELECTABUZZ, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MAGMAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PINSIR, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TAUROS, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGIKARP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GYARADOS, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LAPRAS, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DITTO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EEVEE, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VAPOREON, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.JOLTEON, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FLAREON, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PORYGON, PokemonType.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.OMANYTE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.OMASTAR, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KABUTO, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.KABUTOPS, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.AERODACTYL, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNORLAX, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARTICUNO, PokemonType.ICE, PokemonType.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZAPDOS, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MOLTRES, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DRATINI, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRAGONAIR, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRAGONITE, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEWTWO, PokemonType.PSYCHIC, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MEW, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ Species.CHIKORITA, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BAYLEEF, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MEGANIUM, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CYNDAQUIL, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUILAVA, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TYPHLOSION, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TOTODILE, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CROCONAW, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FERALIGATR, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SENTRET, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FURRET, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HOOTHOOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.NOCTOWL, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LEDYBA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.LEDIAN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.SPINARAK, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ARIADOS, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.CROBAT, PokemonType.POISON, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHINCHOU, PokemonType.WATER, PokemonType.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LANTURN, PokemonType.WATER, PokemonType.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PICHU, PokemonType.ELECTRIC, -1, [ ]
    ],
    [ Species.CLEFFA, PokemonType.FAIRY, -1, [ ]
    ],
    [ Species.IGGLYBUFF, PokemonType.NORMAL, PokemonType.FAIRY, [ ]
    ],
    [ Species.TOGEPI, PokemonType.FAIRY, -1, [ ]
    ],
    [ Species.TOGETIC, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.NATU, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.XATU, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAREEP, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLAAFFY, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.AMPHAROS, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BELLOSSOM, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.MARILL, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AZUMARILL, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SUDOWOODO, PokemonType.ROCK, -1, [
      [ Biome.GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POLITOED, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HOPPIP, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SKIPLOOM, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.JUMPLUFF, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.AIPOM, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SUNKERN, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SUNFLORA, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.YANMA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.WOOPER, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.QUAGSIRE, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ESPEON, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, TimeOfDay.DAY ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ Species.UMBREON, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MURKROW, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLOWKING, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MISDREAVUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.UNOWN, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WOBBUFFET, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GIRAFARIG, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PINECO, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.FORRETRESS, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.DUNSPARCE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GLIGAR, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.STEELIX, PokemonType.STEEL, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNUBBULL, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GRANBULL, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.QWILFISH, PokemonType.WATER, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SCIZOR, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SHUCKLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HERACROSS, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNEASEL, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TEDDIURSA, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.URSARING, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SLUGMA, PokemonType.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAGCARGO, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SWINUB, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PILOSWINE, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CORSOLA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.REMORAID, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.OCTILLERY, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DELIBIRD, PokemonType.ICE, PokemonType.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MANTINE, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKARMORY, PokemonType.STEEL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HOUNDOUR, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HOUNDOOM, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KINGDRA, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PHANPY, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.DONPHAN, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PORYGON2, PokemonType.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.STANTLER, PokemonType.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SMEARGLE, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TYROGUE, PokemonType.FIGHTING, -1, [ ]
    ],
    [ Species.HITMONTOP, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.SMOOCHUM, PokemonType.ICE, PokemonType.PSYCHIC, [ ]
    ],
    [ Species.ELEKID, PokemonType.ELECTRIC, -1, [ ]
    ],
    [ Species.MAGBY, PokemonType.FIRE, -1, [ ]
    ],
    [ Species.MILTANK, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BLISSEY, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RAIKOU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ENTEI, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SUICUNE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LARVITAR, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PUPITAR, PokemonType.ROCK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.TYRANITAR, PokemonType.ROCK, PokemonType.DARK, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.LUGIA, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.HO_OH, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.CELEBI, PokemonType.PSYCHIC, PokemonType.GRASS, [ ]
    ],
    [ Species.TREECKO, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GROVYLE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SCEPTILE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TORCHIC, PokemonType.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.COMBUSKEN, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BLAZIKEN, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MUDKIP, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MARSHTOMP, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SWAMPERT, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POOCHYENA, PokemonType.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.MIGHTYENA, PokemonType.DARK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ZIGZAGOON, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LINOONE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WURMPLE, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SILCOON, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.BEAUTIFLY, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.CASCOON, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.DUSTOX, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LOTAD, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.LOMBRE, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.LUDICOLO, PokemonType.WATER, PokemonType.GRASS, [
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SEEDOT, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.NUZLEAF, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SHIFTRY, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.TAILLOW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SWELLOW, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.WINGULL, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PELIPPER, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.RALTS, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KIRLIA, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GARDEVOIR, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SURSKIT, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MASQUERAIN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHROOMISH, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.BRELOOM, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SLAKOTH, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VIGOROTH, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SLAKING, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.NINCADA, PokemonType.BUG, PokemonType.GROUND, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NINJASK, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHEDINJA, PokemonType.BUG, PokemonType.GHOST, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.WHISMUR, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LOUDRED, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.EXPLOUD, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAKUHITA, PokemonType.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HARIYAMA, PokemonType.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.AZURILL, PokemonType.NORMAL, PokemonType.FAIRY, [ ]
    ],
    [ Species.NOSEPASS, PokemonType.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SKITTY, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.DELCATTY, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SABLEYE, PokemonType.DARK, PokemonType.GHOST, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAWILE, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ARON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.LAIRON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.AGGRON, PokemonType.STEEL, PokemonType.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEDITITE, PokemonType.FIGHTING, PokemonType.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MEDICHAM, PokemonType.FIGHTING, PokemonType.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ELECTRIKE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MANECTRIC, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PLUSLE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MINUN, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.VOLBEAT, PokemonType.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ILLUMISE, PokemonType.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ROSELIA, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GULPIN, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SWALOT, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARVANHA, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SHARPEDO, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.WAILMER, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WAILORD, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NUMEL, PokemonType.FIRE, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CAMERUPT, PokemonType.FIRE, PokemonType.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TORKOAL, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPOINK, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRUMPIG, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPINDA, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TRAPINCH, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VIBRAVA, PokemonType.GROUND, PokemonType.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLYGON, PokemonType.GROUND, PokemonType.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CACNEA, PokemonType.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.CACTURNE, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SWABLU, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ALTARIA, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ZANGOOSE, PokemonType.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SEVIPER, PokemonType.POISON, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LUNATONE, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.SOLROCK, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.BARBOACH, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WHISCASH, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CORPHISH, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRAWDAUNT, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BALTOY, PokemonType.GROUND, PokemonType.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CLAYDOL, PokemonType.GROUND, PokemonType.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LILEEP, PokemonType.ROCK, PokemonType.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.CRADILY, PokemonType.ROCK, PokemonType.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ANORITH, PokemonType.ROCK, PokemonType.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.ARMALDO, PokemonType.ROCK, PokemonType.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FEEBAS, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.MILOTIC, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CASTFORM, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KECLEON, PokemonType.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHUPPET, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BANETTE, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUSKULL, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUSCLOPS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TROPIUS, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CHIMECHO, PokemonType.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ABSOL, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WYNAUT, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ Species.SNORUNT, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GLALIE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPHEAL, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEALEO, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WALREIN, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLAMPERL, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HUNTAIL, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOREBYSS, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.RELICANTH, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LUVDISC, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BAGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SHELGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SALAMENCE, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BELDUM, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.METANG, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.METAGROSS, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.REGIROCK, PokemonType.ROCK, -1, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGICE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGISTEEL, PokemonType.STEEL, -1, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LATIAS, PokemonType.DRAGON, PokemonType.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LATIOS, PokemonType.DRAGON, PokemonType.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KYOGRE, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GROUDON, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.RAYQUAZA, PokemonType.DRAGON, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.JIRACHI, PokemonType.STEEL, PokemonType.PSYCHIC, [ ]
    ],
    [ Species.DEOXYS, PokemonType.PSYCHIC, -1, [ ]
    ],
    [ Species.TURTWIG, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GROTLE, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TORTERRA, PokemonType.GRASS, PokemonType.GROUND, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CHIMCHAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MONFERNO, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INFERNAPE, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PIPLUP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PRINPLUP, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EMPOLEON, PokemonType.WATER, PokemonType.STEEL, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.STARLY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.STARAVIA, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.STARAPTOR, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BIDOOF, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BIBAREL, PokemonType.NORMAL, PokemonType.WATER, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KRICKETOT, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.KRICKETUNE, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SHINX, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LUXIO, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LUXRAY, PokemonType.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BUDEW, PokemonType.GRASS, PokemonType.POISON, [ ]
    ],
    [ Species.ROSERADE, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CRANIDOS, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.RAMPARDOS, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SHIELDON, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.BASTIODON, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BURMY, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WORMADAM, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MOTHIM, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.COMBEE, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VESPIQUEN, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PACHIRISU, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BUIZEL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLOATZEL, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHERUBI, PokemonType.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CHERRIM, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SHELLOS, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GASTRODON, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.AMBIPOM, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRIFLOON, PokemonType.GHOST, PokemonType.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DRIFBLIM, PokemonType.GHOST, PokemonType.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BUNEARY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.LOPUNNY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MISMAGIUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HONCHKROW, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GLAMEOW, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PURUGLY, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHINGLING, PokemonType.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.STUNKY, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SKUNTANK, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.BRONZOR, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BRONZONG, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BONSLY, PokemonType.ROCK, -1, [ ]
    ],
    [ Species.MIME_JR, PokemonType.PSYCHIC, PokemonType.FAIRY, [ ]
    ],
    [ Species.HAPPINY, PokemonType.NORMAL, -1, [ ]
    ],
    [ Species.CHATOT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.SPIRITOMB, PokemonType.GHOST, PokemonType.DARK, [
      [ Biome.GRAVEYARD, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GIBLE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GABITE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARCHOMP, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MUNCHLAX, PokemonType.NORMAL, -1, [ ]
    ],
    [ Species.RIOLU, PokemonType.FIGHTING, -1, [ ]
    ],
    [ Species.LUCARIO, PokemonType.FIGHTING, PokemonType.STEEL, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HIPPOPOTAS, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HIPPOWDON, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SKORUPI, PokemonType.POISON, PokemonType.BUG, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DRAPION, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CROAGUNK, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TOXICROAK, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARNIVINE, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FINNEON, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LUMINEON, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SEA, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.MANTYKE, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SNOVER, PokemonType.GRASS, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ABOMASNOW, PokemonType.GRASS, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WEAVILE, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGNEZONE, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LICKILICKY, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RHYPERIOR, PokemonType.GROUND, PokemonType.ROCK, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TANGROWTH, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ELECTIVIRE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGMORTAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOGEKISS, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YANMEGA, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LEAFEON, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GLACEON, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GLISCOR, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAMOSWINE, PokemonType.ICE, PokemonType.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PORYGON_Z, PokemonType.NORMAL, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GALLADE, PokemonType.PSYCHIC, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PROBOPASS, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUSKNOIR, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FROSLASS, PokemonType.ICE, PokemonType.GHOST, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ROTOM, PokemonType.ELECTRIC, PokemonType.GHOST, [
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
    [ Species.UXIE, PokemonType.PSYCHIC, -1, [
      [ Biome.CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MESPRIT, PokemonType.PSYCHIC, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.AZELF, PokemonType.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DIALGA, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.PALKIA, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.HEATRAN, PokemonType.FIRE, PokemonType.STEEL, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIGIGAS, PokemonType.NORMAL, -1, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GIRATINA, PokemonType.GHOST, PokemonType.DRAGON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.CRESSELIA, PokemonType.PSYCHIC, -1, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.PHIONE, PokemonType.WATER, -1, [ ]
    ],
    [ Species.MANAPHY, PokemonType.WATER, -1, [ ]
    ],
    [ Species.DARKRAI, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SHAYMIN, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ARCEUS, PokemonType.NORMAL, -1, [ ]
    ],
    [ Species.VICTINI, PokemonType.PSYCHIC, PokemonType.FIRE, [ ]
    ],
    [ Species.SNIVY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SERVINE, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SERPERIOR, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TEPIG, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PIGNITE, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EMBOAR, PokemonType.FIRE, PokemonType.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.OSHAWOTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DEWOTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SAMUROTT, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PATRAT, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.WATCHOG, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.LILLIPUP, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HERDIER, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.STOUTLAND, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PURRLOIN, PokemonType.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.LIEPARD, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PANSAGE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMISAGE, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PANSEAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMISEAR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PANPOUR, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMIPOUR, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MUNNA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUSHARNA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PIDOVE, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TRANQUILL, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.UNFEZANT, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BLITZLE, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ZEBSTRIKA, PokemonType.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ROGGENROLA, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOLDORE, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GIGALITH, PokemonType.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WOOBAT, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SWOOBAT, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRILBUR, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.EXCADRILL, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AUDINO, PokemonType.NORMAL, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TIMBURR, PokemonType.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GURDURR, PokemonType.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CONKELDURR, PokemonType.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TYMPOLE, PokemonType.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PALPITOAD, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SEISMITOAD, PokemonType.WATER, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.THROH, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SAWK, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SEWADDLE, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SWADLOON, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.LEAVANNY, PokemonType.BUG, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VENIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.WHIRLIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SCOLIPEDE, PokemonType.BUG, PokemonType.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.COTTONEE, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.WHIMSICOTT, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PETILIL, PokemonType.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.LILLIGANT, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BASCULIN, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDILE, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.KROKOROK, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.KROOKODILE, PokemonType.GROUND, PokemonType.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.DARUMAKA, PokemonType.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DARMANITAN, PokemonType.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MARACTUS, PokemonType.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DWEBBLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRUSTLE, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SCRAGGY, PokemonType.DARK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SCRAFTY, PokemonType.DARK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIGILYPH, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.YAMASK, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.COFAGRIGUS, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TIRTOUGA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.CARRACOSTA, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCHEN, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.ARCHEOPS, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TRUBBISH, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARBODOR, PokemonType.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ZORUA, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ZOROARK, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MINCCINO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CINCCINO, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GOTHITA, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GOTHORITA, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GOTHITELLE, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SOLOSIS, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DUOSION, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.REUNICLUS, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUCKLETT, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SWANNA, PokemonType.WATER, PokemonType.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VANILLITE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VANILLISH, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VANILLUXE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DEERLING, PokemonType.NORMAL, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SAWSBUCK, PokemonType.NORMAL, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.EMOLGA, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KARRABLAST, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ESCAVALIER, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FOONGUS, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.AMOONGUSS, PokemonType.GRASS, PokemonType.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.FRILLISH, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.JELLICENT, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOMOMOLA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.JOLTIK, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GALVANTULA, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FERROSEED, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FERROTHORN, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KLINK, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KLANG, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KLINKLANG, PokemonType.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TYNAMO, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EELEKTRIK, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EELEKTROSS, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ELGYEM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BEHEEYEM, PokemonType.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LITWICK, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LAMPENT, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CHANDELURE, PokemonType.GHOST, PokemonType.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.AXEW, PokemonType.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FRAXURE, PokemonType.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HAXORUS, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CUBCHOO, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BEARTIC, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRYOGONAL, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHELMET, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ACCELGOR, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.STUNFISK, PokemonType.GROUND, PokemonType.ELECTRIC, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MIENFOO, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MIENSHAO, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRUDDIGON, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GOLETT, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLURK, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PAWNIARD, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BISHARP, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOUFFALANT, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.RUFFLET, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BRAVIARY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VULLABY, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.MANDIBUZZ, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.HEATMOR, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DURANT, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DEINO, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ZWEILOUS, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.HYDREIGON, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LARVESTA, PokemonType.BUG, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.VOLCARONA, PokemonType.BUG, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.COBALION, PokemonType.STEEL, PokemonType.FIGHTING, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TERRAKION, PokemonType.ROCK, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.VIRIZION, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TORNADUS, PokemonType.FLYING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.THUNDURUS, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.RESHIRAM, PokemonType.DRAGON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZEKROM, PokemonType.DRAGON, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.LANDORUS, PokemonType.GROUND, PokemonType.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KYUREM, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.KELDEO, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MELOETTA, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.MEADOW, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GENESECT, PokemonType.BUG, PokemonType.STEEL, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHESPIN, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUILLADIN, PokemonType.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHESNAUGHT, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FENNEKIN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BRAIXEN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DELPHOX, PokemonType.FIRE, PokemonType.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FROAKIE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FROGADIER, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GRENINJA, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BUNNELBY, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DIGGERSBY, PokemonType.NORMAL, PokemonType.GROUND, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLETCHLING, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FLETCHINDER, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TALONFLAME, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SCATTERBUG, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SPEWPA, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VIVILLON, PokemonType.BUG, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.LITLEO, PokemonType.FIRE, PokemonType.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PYROAR, PokemonType.FIRE, PokemonType.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLABEBE, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLOETTE, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLORGES, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKIDDO, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOGOAT, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PANCHAM, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PANGORO, PokemonType.FIGHTING, PokemonType.DARK, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.FURFROU, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ESPURR, PokemonType.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.MEOWSTIC, PokemonType.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.HONEDGE, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DOUBLADE, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AEGISLASH, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPRITZEE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AROMATISSE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SWIRLIX, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLURPUFF, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.INKAY, PokemonType.DARK, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.MALAMAR, PokemonType.DARK, PokemonType.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.BINACLE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BARBARACLE, PokemonType.ROCK, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKRELP, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DRAGALGE, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLAUNCHER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CLAWITZER, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HELIOPTILE, PokemonType.ELECTRIC, PokemonType.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HELIOLISK, PokemonType.ELECTRIC, PokemonType.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TYRUNT, PokemonType.ROCK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TYRANTRUM, PokemonType.ROCK, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.AMAURA, PokemonType.ROCK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.AURORUS, PokemonType.ROCK, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SYLVEON, PokemonType.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HAWLUCHA, PokemonType.FIGHTING, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DEDENNE, PokemonType.ELECTRIC, PokemonType.FAIRY, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARBINK, PokemonType.ROCK, PokemonType.FAIRY, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOOMY, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SLIGGOO, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GOODRA, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.KLEFKI, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PHANTUMP, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TREVENANT, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PUMPKABOO, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOURGEIST, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BERGMITE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AVALUGG, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NOIBAT, PokemonType.FLYING, PokemonType.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.NOIVERN, PokemonType.FLYING, PokemonType.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.XERNEAS, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.YVELTAL, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZYGARDE, PokemonType.DRAGON, PokemonType.GROUND, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DIANCIE, PokemonType.ROCK, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.HOOPA, PokemonType.PSYCHIC, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.VOLCANION, PokemonType.FIRE, PokemonType.WATER, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ROWLET, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DARTRIX, PokemonType.GRASS, PokemonType.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DECIDUEYE, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LITTEN, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TORRACAT, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INCINEROAR, PokemonType.FIRE, PokemonType.DARK, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POPPLIO, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BRIONNE, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PRIMARINA, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PIKIPEK, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TRUMBEAK, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TOUCANNON, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YUNGOOS, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GUMSHOOS, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GRUBBIN, PokemonType.BUG, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CHARJABUG, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VIKAVOLT, PokemonType.BUG, PokemonType.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRABRAWLER, PokemonType.FIGHTING, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRABOMINABLE, PokemonType.FIGHTING, PokemonType.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ORICORIO, PokemonType.FIRE, PokemonType.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CUTIEFLY, PokemonType.BUG, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RIBOMBEE, PokemonType.BUG, PokemonType.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ROCKRUFF, PokemonType.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.LYCANROC, PokemonType.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.WISHIWASHI, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAREANIE, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TOXAPEX, PokemonType.POISON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MUDBRAY, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUDSDALE, PokemonType.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DEWPIDER, PokemonType.WATER, PokemonType.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ARAQUANID, PokemonType.WATER, PokemonType.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FOMANTIS, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LURANTIS, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MORELULL, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SHIINOTIC, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SALANDIT, PokemonType.POISON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SALAZZLE, PokemonType.POISON, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.STUFFUL, PokemonType.NORMAL, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BEWEAR, PokemonType.NORMAL, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BOUNSWEET, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.STEENEE, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TSAREENA, PokemonType.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.COMFEY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ORANGURU, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PASSIMIAN, PokemonType.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.WIMPOD, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLISOPOD, PokemonType.BUG, PokemonType.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SANDYGAST, PokemonType.GHOST, PokemonType.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PALOSSAND, PokemonType.GHOST, PokemonType.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PYUKUMUKU, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TYPE_NULL, PokemonType.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.SILVALLY, PokemonType.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MINIOR, PokemonType.ROCK, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KOMALA, PokemonType.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TURTONATOR, PokemonType.FIRE, PokemonType.DRAGON, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOGEDEMARU, PokemonType.ELECTRIC, PokemonType.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MIMIKYU, PokemonType.GHOST, PokemonType.FAIRY, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BRUXISH, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRAMPA, PokemonType.NORMAL, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DHELMISE, PokemonType.GHOST, PokemonType.GRASS, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.JANGMO_O, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HAKAMO_O, PokemonType.DRAGON, PokemonType.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.KOMMO_O, PokemonType.DRAGON, PokemonType.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TAPU_KOKO, PokemonType.ELECTRIC, PokemonType.FAIRY, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_LELE, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_BULU, PokemonType.GRASS, PokemonType.FAIRY, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_FINI, PokemonType.WATER, PokemonType.FAIRY, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.COSMOG, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.COSMOEM, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.SOLGALEO, PokemonType.PSYCHIC, PokemonType.STEEL, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ Species.LUNALA, PokemonType.PSYCHIC, PokemonType.GHOST, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.NIHILEGO, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.BUZZWOLE, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.PHEROMOSA, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.XURKITREE, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CELESTEELA, PokemonType.STEEL, PokemonType.FLYING, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KARTANA, PokemonType.GRASS, PokemonType.STEEL, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GUZZLORD, PokemonType.DARK, PokemonType.DRAGON, [
      [ Biome.SLUM, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.NECROZMA, PokemonType.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MAGEARNA, PokemonType.STEEL, PokemonType.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MARSHADOW, PokemonType.FIGHTING, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.POIPOLE, PokemonType.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.NAGANADEL, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.STAKATAKA, PokemonType.ROCK, PokemonType.STEEL, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.BLACEPHALON, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ISLAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZERAORA, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MELTAN, PokemonType.STEEL, -1, [ ]
    ],
    [ Species.MELMETAL, PokemonType.STEEL, -1, [ ]
    ],
    [ Species.GROOKEY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.THWACKEY, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RILLABOOM, PokemonType.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SCORBUNNY, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RABOOT, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CINDERACE, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SOBBLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRIZZILE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INTELEON, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SKWOVET, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GREEDENT, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ROOKIDEE, PokemonType.FLYING, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CORVISQUIRE, PokemonType.FLYING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CORVIKNIGHT, PokemonType.FLYING, PokemonType.STEEL, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BLIPBUG, PokemonType.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.DOTTLER, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ORBEETLE, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.NICKIT, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.THIEVUL, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOSSIFLEUR, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ELDEGOSS, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WOOLOO, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUBWOOL, PokemonType.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHEWTLE, PokemonType.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DREDNAW, PokemonType.WATER, PokemonType.ROCK, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YAMPER, PokemonType.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.BOLTUND, PokemonType.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ROLYCOLY, PokemonType.ROCK, -1, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CARKOL, PokemonType.ROCK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.COALOSSAL, PokemonType.ROCK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.APPLIN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLAPPLE, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.APPLETUN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SILICOBRA, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDACONDA, PokemonType.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRAMORANT, PokemonType.FLYING, PokemonType.WATER, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ARROKUDA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BARRASKEWDA, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOXEL, PokemonType.ELECTRIC, PokemonType.POISON, [ ]
    ],
    [ Species.TOXTRICITY, PokemonType.ELECTRIC, PokemonType.POISON, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.SIZZLIPEDE, PokemonType.FIRE, PokemonType.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CENTISKORCH, PokemonType.FIRE, PokemonType.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.CLOBBOPUS, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRAPPLOCT, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SINISTEA, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.POLTEAGEIST, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HATENNA, PokemonType.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.HATTREM, PokemonType.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.HATTERENE, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.IMPIDIMP, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MORGREM, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRIMMSNARL, PokemonType.DARK, PokemonType.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.OBSTAGOON, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.PERRSERKER, PokemonType.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.CURSOLA, PokemonType.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SIRFETCHD, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MR_RIME, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RUNERIGUS, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.MILCERY, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALCREMIE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FALINKS, PokemonType.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PINCURCHIN, PokemonType.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SNOM, PokemonType.ICE, PokemonType.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.FROSMOTH, PokemonType.ICE, PokemonType.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.STONJOURNER, PokemonType.ROCK, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EISCUE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.INDEEDEE, PokemonType.PSYCHIC, PokemonType.NORMAL, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.MORPEKO, PokemonType.ELECTRIC, PokemonType.DARK, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.CUFANT, PokemonType.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.COPPERAJAH, PokemonType.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRACOZOLT, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCTOZOLT, PokemonType.ELECTRIC, PokemonType.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DRACOVISH, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCTOVISH, PokemonType.WATER, PokemonType.ICE, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DURALUDON, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DREEPY, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.DRAKLOAK, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.DRAGAPULT, PokemonType.DRAGON, PokemonType.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ZACIAN, PokemonType.FAIRY, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZAMAZENTA, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ETERNATUS, PokemonType.POISON, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KUBFU, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.URSHIFU, PokemonType.FIGHTING, PokemonType.DARK, [
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZARUDE, PokemonType.DARK, PokemonType.GRASS, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIELEKI, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIDRAGO, PokemonType.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GLASTRIER, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SPECTRIER, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CALYREX, PokemonType.PSYCHIC, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.WYRDEER, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.KLEAVOR, PokemonType.BUG, PokemonType.ROCK, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.URSALUNA, PokemonType.GROUND, PokemonType.NORMAL, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BASCULEGION, PokemonType.WATER, PokemonType.GHOST, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNEASLER, PokemonType.FIGHTING, PokemonType.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.OVERQWIL, PokemonType.DARK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ENAMORUS, PokemonType.FAIRY, PokemonType.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SPRIGATITO, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLORAGATO, PokemonType.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MEOWSCARADA, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FUECOCO, PokemonType.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CROCALOR, PokemonType.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SKELEDIRGE, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.QUAXLY, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUAXWELL, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUAQUAVAL, PokemonType.WATER, PokemonType.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LECHONK, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.OINKOLOGNE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TAROUNTULA, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SPIDOPS, PokemonType.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NYMBLE, PokemonType.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LOKIX, PokemonType.BUG, PokemonType.DARK, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PAWMI, PokemonType.ELECTRIC, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PAWMO, PokemonType.ELECTRIC, PokemonType.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PAWMOT, PokemonType.ELECTRIC, PokemonType.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TANDEMAUS, PokemonType.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.MAUSHOLD, PokemonType.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FIDOUGH, PokemonType.FAIRY, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DACHSBUN, PokemonType.FAIRY, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SMOLIV, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.DOLLIV, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ARBOLIVA, PokemonType.GRASS, PokemonType.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SQUAWKABILLY, PokemonType.NORMAL, PokemonType.FLYING, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.NACLI, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NACLSTACK, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARGANACL, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHARCADET, PokemonType.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ARMAROUGE, PokemonType.FIRE, PokemonType.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CERULEDGE, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TADBULB, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BELLIBOLT, PokemonType.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WATTREL, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KILOWATTREL, PokemonType.ELECTRIC, PokemonType.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MASCHIFF, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MABOSSTIFF, PokemonType.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHROODLE, PokemonType.POISON, PokemonType.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRAFAIAI, PokemonType.POISON, PokemonType.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BRAMBLIN, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BRAMBLEGHAST, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOEDSCOOL, PokemonType.GROUND, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TOEDSCRUEL, PokemonType.GROUND, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KLAWF, PokemonType.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CAPSAKID, PokemonType.GRASS, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.SCOVILLAIN, PokemonType.GRASS, PokemonType.FIRE, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.RELLOR, PokemonType.BUG, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.RABSCA, PokemonType.BUG, PokemonType.PSYCHIC, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FLITTLE, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ESPATHRA, PokemonType.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.TINKATINK, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TINKATUFF, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TINKATON, PokemonType.FAIRY, PokemonType.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WIGLETT, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WUGTRIO, PokemonType.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOMBIRDIER, PokemonType.FLYING, PokemonType.DARK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.FINIZEN, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PALAFIN, PokemonType.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.VAROOM, PokemonType.STEEL, PokemonType.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.REVAVROOM, PokemonType.STEEL, PokemonType.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CYCLIZAR, PokemonType.DRAGON, PokemonType.NORMAL, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ORTHWORM, PokemonType.STEEL, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GLIMMET, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GLIMMORA, PokemonType.ROCK, PokemonType.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GREAVARD, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HOUNDSTONE, PokemonType.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLAMIGO, PokemonType.FLYING, PokemonType.FIGHTING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CETODDLE, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CETITAN, PokemonType.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VELUZA, PokemonType.WATER, PokemonType.PSYCHIC, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DONDOZO, PokemonType.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TATSUGIRI, PokemonType.DRAGON, PokemonType.WATER, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ANNIHILAPE, PokemonType.FIGHTING, PokemonType.GHOST, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLODSIRE, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.FARIGIRAF, PokemonType.NORMAL, PokemonType.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DUDUNSPARCE, PokemonType.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KINGAMBIT, PokemonType.DARK, PokemonType.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GREAT_TUSK, PokemonType.GROUND, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SCREAM_TAIL, PokemonType.FAIRY, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BRUTE_BONNET, PokemonType.GRASS, PokemonType.DARK, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLUTTER_MANE, PokemonType.GHOST, PokemonType.FAIRY, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLITHER_WING, PokemonType.BUG, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDY_SHOCKS, PokemonType.ELECTRIC, PokemonType.GROUND, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_TREADS, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_BUNDLE, PokemonType.ICE, PokemonType.WATER, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_HANDS, PokemonType.FIGHTING, PokemonType.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_JUGULIS, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_MOTH, PokemonType.FIRE, PokemonType.POISON, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_THORNS, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FRIGIBAX, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ARCTIBAX, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BAXCALIBUR, PokemonType.DRAGON, PokemonType.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GIMMIGHOUL, PokemonType.GHOST, -1, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GHOLDENGO, PokemonType.STEEL, PokemonType.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.WO_CHIEN, PokemonType.DARK, PokemonType.GRASS, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHIEN_PAO, PokemonType.DARK, PokemonType.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TING_LU, PokemonType.DARK, PokemonType.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHI_YU, PokemonType.DARK, PokemonType.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ROARING_MOON, PokemonType.DRAGON, PokemonType.DARK, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.IRON_VALIANT, PokemonType.FAIRY, PokemonType.FIGHTING, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KORAIDON, PokemonType.FIGHTING, PokemonType.DRAGON, [
      [ Biome.RUINS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MIRAIDON, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.WALKING_WAKE, PokemonType.WATER, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_LEAVES, PokemonType.GRASS, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DIPPLIN, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.POLTCHAGEIST, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SINISTCHA, PokemonType.GRASS, PokemonType.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.OKIDOGI, PokemonType.POISON, PokemonType.FIGHTING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MUNKIDORI, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.FEZANDIPITI, PokemonType.POISON, PokemonType.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.OGERPON, PokemonType.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ARCHALUDON, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HYDRAPPLE, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GOUGING_FIRE, PokemonType.FIRE, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RAGING_BOLT, PokemonType.ELECTRIC, PokemonType.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_BOULDER, PokemonType.ROCK, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_CROWN, PokemonType.STEEL, PokemonType.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TERAPAGOS, PokemonType.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.PECHARUNT, PokemonType.POISON, PokemonType.GHOST, [ ]
    ],
    [ Species.ALOLA_RATTATA, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ALOLA_RATICATE, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ALOLA_RAICHU, PokemonType.ELECTRIC, PokemonType.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ALOLA_SANDSHREW, PokemonType.ICE, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ALOLA_SANDSLASH, PokemonType.ICE, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ALOLA_VULPIX, PokemonType.ICE, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ALOLA_NINETALES, PokemonType.ICE, PokemonType.FAIRY, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ALOLA_DIGLETT, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_DUGTRIO, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_MEOWTH, PokemonType.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ALOLA_PERSIAN, PokemonType.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ALOLA_GEODUDE, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_GRAVELER, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_GOLEM, PokemonType.ROCK, PokemonType.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_GRIMER, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_MUK, PokemonType.POISON, PokemonType.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_EXEGGUTOR, PokemonType.GRASS, PokemonType.DRAGON, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.ALOLA_MAROWAK, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.ETERNAL_FLOETTE, PokemonType.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GALAR_MEOWTH, PokemonType.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.GALAR_PONYTA, PokemonType.PSYCHIC, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.GALAR_RAPIDASH, PokemonType.PSYCHIC, PokemonType.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.GALAR_SLOWPOKE, PokemonType.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GALAR_SLOWBRO, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GALAR_FARFETCHD, PokemonType.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_WEEZING, PokemonType.POISON, PokemonType.FAIRY, [
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GALAR_MR_MIME, PokemonType.ICE, PokemonType.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_ARTICUNO, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_ZAPDOS, PokemonType.FIGHTING, PokemonType.FLYING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_MOLTRES, PokemonType.DARK, PokemonType.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_SLOWKING, PokemonType.POISON, PokemonType.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GALAR_CORSOLA, PokemonType.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_ZIGZAGOON, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.GALAR_LINOONE, PokemonType.DARK, PokemonType.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.GALAR_DARUMAKA, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GALAR_DARMANITAN, PokemonType.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.GALAR_YAMASK, PokemonType.GROUND, PokemonType.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.GALAR_STUNFISK, PokemonType.GROUND, PokemonType.STEEL, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_GROWLITHE, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_ARCANINE, PokemonType.FIRE, PokemonType.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_VOLTORB, PokemonType.ELECTRIC, PokemonType.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_ELECTRODE, PokemonType.ELECTRIC, PokemonType.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_TYPHLOSION, PokemonType.FIRE, PokemonType.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_QWILFISH, PokemonType.DARK, PokemonType.POISON, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_SNEASEL, PokemonType.FIGHTING, PokemonType.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HISUI_SAMUROTT, PokemonType.WATER, PokemonType.DARK, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_LILLIGANT, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HISUI_ZORUA, PokemonType.NORMAL, PokemonType.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.HISUI_ZOROARK, PokemonType.NORMAL, PokemonType.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.HISUI_BRAVIARY, PokemonType.PSYCHIC, PokemonType.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HISUI_SLIGGOO, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HISUI_GOODRA, PokemonType.STEEL, PokemonType.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.HISUI_AVALUGG, PokemonType.ICE, PokemonType.ROCK, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_DECIDUEYE, PokemonType.GRASS, PokemonType.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PALDEA_TAUROS, PokemonType.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ]]
    ]
    ],
    [ Species.PALDEA_WOOPER, PokemonType.POISON, PokemonType.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ]]
    ]
    ],
    [ Species.BLOODMOON_URSALUNA, PokemonType.GROUND, PokemonType.NORMAL, [
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
    const speciesId = pb[0] as Species;
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
          const existingSpeciesIds = biomeTierPool[t] as unknown as Species[];
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
          (biomeTierPool[treeIndex] as unknown as Species[]).splice(arrayIndex, 0, speciesId);
        } else {
          (biomeTierPool as unknown as Species[][]).push([ speciesId ]);
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
