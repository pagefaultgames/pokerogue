import { Species } from "./enums/species";
import { Type } from "./type";
import * as Utils from "../utils";
import beautify from "json-beautify";
import { TrainerType } from "./enums/trainer-type";
import { TimeOfDay } from "./enums/time-of-day";
import { Biome } from "./enums/biome";
import {pokemonEvolutions, SpeciesFormEvolution} from "./pokemon-evolutions";

export function getBiomeName(biome: Biome | -1) {
  if (biome === -1) {
    return "Somewhere you can't remember";
  }
  switch (biome) {
  case Biome.GRASS:
    return "Grassy Field";
  case Biome.RUINS:
    return "Ancient Ruins";
  case Biome.ABYSS:
    return "The Abyss";
  case Biome.END:
    return "???";
  default:
    return Utils.toReadableString(Biome[biome]);
  }
}

interface BiomeLinks {
  [key: integer]: Biome | (Biome | [Biome, integer])[]
}

interface BiomeDepths {
  [key: integer]: [integer, integer]
}

export const biomeLinks: BiomeLinks = {
  [Biome.TOWN]: Biome.PLAINS,
  [Biome.PLAINS]: [ Biome.GRASS, Biome.METROPOLIS, Biome.LAKE ],
  [Biome.GRASS]: Biome.TALL_GRASS,
  [Biome.TALL_GRASS]: [ Biome.FOREST, Biome.CAVE ],
  [Biome.SLUM]: Biome.CONSTRUCTION_SITE,
  [Biome.FOREST]: [ Biome.JUNGLE, Biome.MEADOW ],
  [Biome.SEA]: [ Biome.SEABED, Biome.ICE_CAVE ],
  [Biome.SWAMP]: [ Biome.GRAVEYARD, Biome.TALL_GRASS ],
  [Biome.BEACH]: [ Biome.SEA, [ Biome.ISLAND, 4 ] ],
  [Biome.LAKE]: [ Biome.BEACH, Biome.SWAMP, Biome.CONSTRUCTION_SITE ],
  [Biome.SEABED]: [ Biome.CAVE, [ Biome.VOLCANO, 4 ] ],
  [Biome.MOUNTAIN]: [ Biome.VOLCANO, [ Biome.WASTELAND, 3 ] ],
  [Biome.BADLANDS]: [ Biome.DESERT, Biome.MOUNTAIN ],
  [Biome.CAVE]: [ Biome.BADLANDS, Biome.LAKE ],
  [Biome.DESERT]: Biome.RUINS,
  [Biome.ICE_CAVE]: Biome.SNOWY_FOREST,
  [Biome.MEADOW]: [ Biome.PLAINS, [ Biome.FAIRY_CAVE, 2 ] ],
  [Biome.POWER_PLANT]: Biome.FACTORY,
  [Biome.VOLCANO]: [ Biome.BEACH, [ Biome.ICE_CAVE, 4 ] ],
  [Biome.GRAVEYARD]: Biome.ABYSS,
  [Biome.DOJO]: [ Biome.PLAINS, [ Biome.TEMPLE, 3 ] ],
  [Biome.FACTORY]: [ Biome.PLAINS, [ Biome.LABORATORY, 8 ] ],
  [Biome.RUINS]: [ Biome.FOREST ],
  [Biome.WASTELAND]: Biome.BADLANDS,
  [Biome.ABYSS]: [ Biome.CAVE, [ Biome.SPACE, 3 ], [ Biome.WASTELAND, 3 ] ],
  [Biome.SPACE]: Biome.RUINS,
  [Biome.CONSTRUCTION_SITE]: [ Biome.DOJO, Biome.POWER_PLANT ],
  [Biome.JUNGLE]: [ Biome.TEMPLE ],
  [Biome.FAIRY_CAVE]: [ Biome.ICE_CAVE, [ Biome.SPACE, 3 ] ],
  [Biome.TEMPLE]: [ Biome.SWAMP, [ Biome.RUINS, 3 ] ],
  [Biome.METROPOLIS]: Biome.SLUM,
  [Biome.SNOWY_FOREST]: [ Biome.FOREST, Biome.LAKE, Biome.MOUNTAIN ],
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
  [key: integer]: Species[]
}

export interface PokemonPools {
  [key: integer]: (Species | SpeciesTree)[]
}

export interface BiomeTierPokemonPools {
  [key: integer]: PokemonPools
}

export interface BiomePokemonPools {
  [key: integer]: BiomeTierPokemonPools
}

export interface BiomeTierTrainerPools {
  [key: integer]: TrainerType[]
}

export interface BiomeTrainerPools {
  [key: integer]: BiomeTierTrainerPools
}

export const biomePokemonPools: BiomePokemonPools = {
  [Biome.TOWN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.CATERPIE ], 7: [ Species.METAPOD ] },
        Species.SENTRET,
        Species.LEDYBA,
        Species.HOPPIP,
        Species.SUNKERN,
        Species.STARLY,
        Species.PIDOVE,
        Species.COTTONEE,
        { 1: [ Species.SCATTERBUG ], 9: [ Species.SPEWPA ] },
        Species.YUNGOOS,
        Species.SKWOVET
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.CATERPIE ], 7: [ Species.METAPOD ] },
        Species.SENTRET,
        Species.HOPPIP,
        Species.SUNKERN,
        Species.SILCOON,
        Species.STARLY,
        Species.PIDOVE,
        Species.COTTONEE,
        { 1: [ Species.SCATTERBUG ], 9: [ Species.SPEWPA ] },
        Species.YUNGOOS,
        Species.SKWOVET
      ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.WEEDLE ], 7: [ Species.KAKUNA ] }, Species.POOCHYENA, Species.PATRAT, Species.PURRLOIN, Species.BLIPBUG ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.WEEDLE ], 7: [ Species.KAKUNA ] }, Species.HOOTHOOT, Species.SPINARAK, Species.POOCHYENA, Species.CASCOON, Species.PATRAT, Species.PURRLOIN, Species.BLIPBUG ],
      [TimeOfDay.ALL]: [ Species.PIDGEY, Species.RATTATA, Species.SPEAROW, Species.ZIGZAGOON, Species.WURMPLE, Species.TAILLOW, Species.BIDOOF, Species.LILLIPUP, Species.FLETCHLING, Species.WOOLOO, Species.LECHONK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.BELLSPROUT, Species.POOCHYENA, Species.LOTAD, Species.SKITTY, Species.COMBEE, Species.CHERUBI, Species.PATRAT, Species.MINCCINO, Species.PAWMI ],
      [TimeOfDay.DAY]: [ Species.NIDORAN_F, Species.NIDORAN_M, Species.BELLSPROUT, Species.POOCHYENA, Species.LOTAD, Species.SKITTY, Species.COMBEE, Species.CHERUBI, Species.PATRAT, Species.MINCCINO, Species.PAWMI ],
      [TimeOfDay.DUSK]: [ Species.EKANS, Species.ODDISH, Species.MEOWTH, Species.SPINARAK, Species.SEEDOT, Species.SHROOMISH, Species.KRICKETOT, Species.VENIPEDE ],
      [TimeOfDay.NIGHT]: [ Species.EKANS, Species.ODDISH, Species.PARAS, Species.VENONAT, Species.MEOWTH, Species.SEEDOT, Species.SHROOMISH, Species.KRICKETOT, Species.VENIPEDE ],
      [TimeOfDay.ALL]: [ Species.NINCADA, Species.WHISMUR, Species.FIDOUGH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [ Species.TANDEMAUS ], [TimeOfDay.DAY]: [ Species.TANDEMAUS ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ABRA, Species.SURSKIT, Species.ROOKIDEE ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.EEVEE, Species.RALTS ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.PLAINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.SENTRET ], 15: [ Species.FURRET ] }, { 1: [ Species.YUNGOOS ], 30: [ Species.GUMSHOOS ] }, { 1: [ Species.SKWOVET ], 24: [ Species.GREEDENT ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.SENTRET ], 15: [ Species.FURRET ] }, { 1: [ Species.YUNGOOS ], 30: [ Species.GUMSHOOS ] }, { 1: [ Species.SKWOVET ], 24: [ Species.GREEDENT ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.MEOWTH ], 28: [ Species.PERSIAN ] }, { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.ZUBAT ], 22: [ Species.GOLBAT ] }, { 1: [ Species.MEOWTH ], 28: [ Species.PERSIAN ] }, { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ] }, { 1: [ Species.BIDOOF ], 15: [ Species.BIBAREL ] }, { 1: [ Species.LECHONK ], 18: [ Species.OINKOLOGNE ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.DODUO ], 31: [ Species.DODRIO ] },
        { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ] },
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.DODUO ], 31: [ Species.DODRIO ] },
        { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ] },
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
        { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] },
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] },
        { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] },
        Species.PIKACHU,
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ Species.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ Species.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] }, { 1: [ Species.BUNEARY ], 20: [ Species.LOPUNNY ] }, { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FARFETCHD, Species.LICKITUNG, Species.CHANSEY, Species.EEVEE, Species.SNORLAX, { 1: [ Species.DUNSPARCE ], 62: [ Species.DUDUNSPARCE ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.LATIAS, Species.LATIOS ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LATIAS, Species.LATIOS ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.HOPPIP ], 18: [ Species.SKIPLOOM ] }, Species.SUNKERN, Species.COTTONEE, Species.PETILIL ],
      [TimeOfDay.DAY]: [ { 1: [ Species.HOPPIP ], 18: [ Species.SKIPLOOM ] }, Species.SUNKERN, Species.COTTONEE, Species.PETILIL ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] }, { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] }, { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] } ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] }, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] }, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] } ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.BULBASAUR ], 16: [ Species.IVYSAUR ], 32: [ Species.VENUSAUR ] }, Species.GROWLITHE, { 1: [ Species.TURTWIG ], 18: [ Species.GROTLE ], 32: [ Species.TORTERRA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUDOWOODO ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VIRIZION ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ], [TimeOfDay.DAY]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VENUSAUR, Species.SUDOWOODO, Species.TORTERRA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VIRIZION ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.BOUNSWEET ], 18: [ Species.STEENEE ], 58: [ Species.TSAREENA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.NIDORAN_F ], 16: [ Species.NIDORINA ] }, { 1: [ Species.NIDORAN_M ], 16: [ Species.NIDORINO ] }, { 1: [ Species.BOUNSWEET ], 18: [ Species.STEENEE ], 58: [ Species.TSAREENA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.ODDISH ], 21: [ Species.GLOOM ] }, { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.ODDISH ], 21: [ Species.GLOOM ] }, { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.NINCADA ], 20: [ Species.NINJASK ] }, { 1: [ Species.FOMANTIS ], 44: [ Species.LURANTIS ] }, { 1: [ Species.NYMBLE ], 24: [ Species.LOKIX ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.PARAS ], 24: [ Species.PARASECT ] }, { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ] }, { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] } ],
      [TimeOfDay.ALL]: [ Species.VULPIX ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.PINSIR, { 1: [ Species.CHIKORITA ], 16: [ Species.BAYLEEF ], 32: [ Species.MEGANIUM ] }, { 1: [ Species.GIRAFARIG ], 62: [ Species.FARIGIRAF ] }, Species.ZANGOOSE, Species.KECLEON, Species.TROPIUS ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SCYTHER, Species.SHEDINJA, Species.ROTOM ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.TSAREENA ],
      [TimeOfDay.DAY]: [ Species.NIDOQUEEN, Species.NIDOKING, Species.TSAREENA ],
      [TimeOfDay.DUSK]: [ Species.VILEPLUME, Species.KRICKETUNE ],
      [TimeOfDay.NIGHT]: [ Species.VILEPLUME, Species.KRICKETUNE ],
      [TimeOfDay.ALL]: [ Species.NINJASK, Species.ZANGOOSE, Species.KECLEON, Species.LURANTIS, Species.LOKIX ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.BELLOSSOM ], [TimeOfDay.DAY]: [ Species.BELLOSSOM ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.PINSIR, Species.MEGANIUM, Species.FARIGIRAF ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.YAMPER ], 25: [ Species.BOLTUND ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.YAMPER ], 25: [ Species.BOLTUND ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ] }, { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ] }, { 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ] }, { 1: [ Species.LILLIPUP ], 16: [ Species.HERDIER ], 32: [ Species.STOUTLAND ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] }, Species.INDEEDEE ],
      [TimeOfDay.DAY]: [ { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] }, Species.INDEEDEE ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.ESPURR ], 25: [ Species.MEOWSTIC ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.ESPURR ], 25: [ Species.MEOWSTIC ] } ],
      [TimeOfDay.ALL]: [ Species.PIKACHU, { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ] }, Species.FURFROU, { 1: [ Species.FIDOUGH ], 26: [ Species.DACHSBUN ] }, Species.SQUAWKABILLY ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.TANDEMAUS ], 25: [ Species.MAUSHOLD ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.TANDEMAUS ], 25: [ Species.MAUSHOLD ] } ],
      [TimeOfDay.DUSK]: [ Species.MORPEKO ],
      [TimeOfDay.NIGHT]: [ Species.MORPEKO ],
      [TimeOfDay.ALL]: [ { 1: [ Species.VAROOM ], 40: [ Species.REVAVROOM ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.EEVEE, Species.SMEARGLE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CASTFORM ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.BOLTUND ], [TimeOfDay.DAY]: [ Species.BOLTUND ], [TimeOfDay.DUSK]: [ Species.MEOWSTIC ], [TimeOfDay.NIGHT]: [ Species.MEOWSTIC ], [TimeOfDay.ALL]: [ Species.STOUTLAND, Species.FURFROU, Species.DACHSBUN ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.MAUSHOLD ], [TimeOfDay.DAY]: [ Species.MAUSHOLD ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CASTFORM, Species.REVAVROOM ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        Species.BUTTERFREE,
        { 1: [ Species.BELLSPROUT ], 21: [ Species.WEEPINBELL ] },
        { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] },
        Species.PETILIL,
        { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ] },
        Species.VIVILLON
      ],
      [TimeOfDay.DAY]: [
        Species.BUTTERFREE,
        { 1: [ Species.BELLSPROUT ], 21: [ Species.WEEPINBELL ] },
        Species.BEAUTIFLY,
        { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] },
        Species.PETILIL,
        { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ] },
        Species.VIVILLON
      ],
      [TimeOfDay.DUSK]: [
        Species.BEEDRILL,
        { 1: [ Species.PINECO ], 31: [ Species.FORRETRESS ] },
        { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] },
        { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] },
        { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ] }
      ],
      [TimeOfDay.NIGHT]: [
        Species.BEEDRILL,
        { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ] },
        { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] },
        { 1: [ Species.PINECO ], 31: [ Species.FORRETRESS ] },
        Species.DUSTOX,
        { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] },
        { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] },
        { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ] }
      ],
      [TimeOfDay.ALL]: [ { 1: [ Species.TAROUNTULA ], 15: [ Species.SPIDOPS ] }, { 1: [ Species.NYMBLE ], 24: [ Species.LOKIX ] }, { 1: [ Species.SHROODLE ], 28: [ Species.GRAFAIAI ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.ROSELIA, Species.MOTHIM, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] } ],
      [TimeOfDay.DAY]: [ Species.ROSELIA, Species.MOTHIM, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] }, { 1: [ Species.DOTTLER ], 30: [ Species.ORBEETLE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.HOOTHOOT ], 20: [ Species.NOCTOWL ] }, { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] }, { 1: [ Species.DOTTLER ], 30: [ Species.ORBEETLE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] },
        { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
        { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] },
        { 1: [ Species.PANSAGE ], 30: [ Species.SIMISAGE ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ Species.EXEGGCUTE, Species.STANTLER ],
      [TimeOfDay.DAY]: [ Species.EXEGGCUTE, Species.STANTLER ],
      [TimeOfDay.DUSK]: [ Species.SCYTHER ],
      [TimeOfDay.NIGHT]: [ Species.SCYTHER ],
      [TimeOfDay.ALL]: [
        Species.HERACROSS,
        { 1: [ Species.TREECKO ], 16: [ Species.GROVYLE ], 36: [ Species.SCEPTILE ] },
        Species.TROPIUS,
        Species.KARRABLAST,
        Species.SHELMET,
        { 1: [ Species.CHESPIN ], 16: [ Species.QUILLADIN ], 36: [ Species.CHESNAUGHT ] },
        { 1: [ Species.ROWLET ], 17: [ Species.DARTRIX ], 34: [ Species.DECIDUEYE ] },
        Species.SQUAWKABILLY,
        { 1: [ Species.TOEDSCOOL ], 30: [ Species.TOEDSCRUEL ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.BLOODMOON_URSALUNA ], [TimeOfDay.ALL]: [ Species.DURANT ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KARTANA, Species.WO_CHIEN ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KARTANA, Species.WO_CHIEN ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CALYREX ] }
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] }, { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ] }, Species.CRAMORANT, { 1: [ Species.FINIZEN ], 38: [ Species.PALAFIN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] }, { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ] }, Species.CRAMORANT, { 1: [ Species.FINIZEN ], 38: [ Species.PALAFIN ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.INKAY ], 30: [ Species.MALAMAR ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.FINNEON ], 31: [ Species.LUMINEON ] }, { 1: [ Species.INKAY ], 30: [ Species.MALAMAR ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] }, { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] }, { 1: [ Species.BUIZEL ], 26: [ Species.FLOATZEL ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.STARYU ], 30: [ Species.STARMIE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.STARYU ], 30: [ Species.STARMIE ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] }, Species.SHELLDER, { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] }, Species.SHELLDER, { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ] }, { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ] },
        { 1: [ Species.HORSEA ], 32: [ Species.SEADRA ] },
        { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
        { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] },
        { 1: [ Species.PANPOUR ], 30: [ Species.SIMIPOUR ] },
        { 1: [ Species.WATTREL ], 25: [ Species.KILOWATTREL ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.LAPRAS, { 1: [ Species.PIPLUP ], 16: [ Species.PRINPLUP ], 36: [ Species.EMPOLEON ] }, { 1: [ Species.POPPLIO ], 17: [ Species.BRIONNE ], 34: [ Species.PRIMARINA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KINGDRA, Species.ROTOM, { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.PELIPPER, Species.CRAMORANT, Species.PALAFIN ],
      [TimeOfDay.DAY]: [ Species.PELIPPER, Species.CRAMORANT, Species.PALAFIN ],
      [TimeOfDay.DUSK]: [ Species.SHARPEDO, Species.MALAMAR ],
      [TimeOfDay.NIGHT]: [ Species.SHARPEDO, Species.LUMINEON, Species.MALAMAR ],
      [TimeOfDay.ALL]: [ Species.TENTACRUEL, Species.FLOATZEL, Species.SIMIPOUR, Species.KILOWATTREL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KINGDRA, Species.EMPOLEON, Species.PRIMARINA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LUGIA ] }
  },
  [Biome.SWAMP]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] }, { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] }, { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] }, { 1: [ Species.PALDEA_WOOPER ], 20: [ Species.CLODSIRE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] }, { 1: [ Species.PALDEA_WOOPER ], 20: [ Species.CLODSIRE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ] },
        { 1: [ Species.GULPIN ], 26: [ Species.SWALOT ] },
        { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ] },
        { 1: [ Species.TYMPOLE ], 25: [ Species.PALPITOAD ], 36: [ Species.SEISMITOAD ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ] },
        { 1: [ Species.BARBOACH ], 30: [ Species.WHISCASH ] },
        { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
        Species.STUNFISK,
        { 1: [ Species.MAREANIE ], 38: [ Species.TOXAPEX ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.TOTODILE ], 18: [ Species.CROCONAW ], 30: [ Species.FERALIGATR ] }, { 1: [ Species.MUDKIP ], 16: [ Species.MARSHTOMP ], 36: [ Species.SWAMPERT ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.GALAR_SLOWPOKE ], 40: [ Species.GALAR_SLOWBRO ] }, { 1: [ Species.HISUI_SLIGGOO ], 80: [ Species.HISUI_GOODRA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.GALAR_SLOWPOKE ], 40: [ Species.GALAR_SLOWBRO ] }, { 1: [ Species.HISUI_SLIGGOO ], 80: [ Species.HISUI_GOODRA ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.POLITOED, Species.GALAR_STUNFISK ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AZELF, Species.POIPOLE ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AZELF, Species.NAGANADEL ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.STARYU ], 30: [ Species.STARMIE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.STARYU ], 30: [ Species.STARMIE ] } ],
      [TimeOfDay.DUSK]: [ Species.SHELLDER ],
      [TimeOfDay.NIGHT]: [ Species.SHELLDER ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.KRABBY ], 28: [ Species.KINGLER ] },
        { 1: [ Species.CORPHISH ], 30: [ Species.CRAWDAUNT ] },
        { 1: [ Species.DWEBBLE ], 34: [ Species.CRUSTLE ] },
        { 1: [ Species.BINACLE ], 39: [ Species.BARBARACLE ] },
        { 1: [ Species.MAREANIE ], 38: [ Species.TOXAPEX ] },
        { 1: [ Species.WIGLETT ], 26: [ Species.WUGTRIO ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] }, { 1: [ Species.CLAUNCHER ], 37: [ Species.CLAWITZER ] }, { 1: [ Species.SANDYGAST ], 42: [ Species.PALOSSAND ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.QUAXLY ], 16: [ Species.QUAXWELL ], 36: [ Species.QUAQUAVAL ] }, Species.TATSUGIRI ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRESSELIA, Species.KELDEO, Species.TAPU_FINI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.STARMIE ],
      [TimeOfDay.DAY]: [ Species.STARMIE ],
      [TimeOfDay.DUSK]: [ Species.CLOYSTER ],
      [TimeOfDay.NIGHT]: [ Species.CLOYSTER ],
      [TimeOfDay.ALL]: [ Species.KINGLER, Species.CRAWDAUNT, Species.WORMADAM, Species.CRUSTLE, Species.BARBARACLE, Species.CLAWITZER, Species.TOXAPEX, Species.PALOSSAND ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CARRACOSTA, Species.QUAQUAVAL ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRESSELIA, Species.KELDEO, Species.TAPU_FINI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] }, { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] }, { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ] },
        { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
        { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] },
        { 1: [ Species.CHEWTLE ], 22: [ Species.DREDNAW ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.DEWPIDER ], 22: [ Species.ARAQUANID ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.DEWPIDER ], 22: [ Species.ARAQUANID ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] }, { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] }, { 1: [ Species.SURSKIT ], 22: [ Species.MASQUERAIN ] }, Species.WISHIWASHI, Species.FLAMIGO ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SQUIRTLE ], 16: [ Species.WARTORTLE ], 36: [ Species.BLASTOISE ] },
        { 1: [ Species.OSHAWOTT ], 17: [ Species.DEWOTT ], 36: [ Species.SAMUROTT ] },
        { 1: [ Species.FROAKIE ], 16: [ Species.FROGADIER ], 36: [ Species.GRENINJA ] },
        { 1: [ Species.SOBBLE ], 16: [ Species.DRIZZILE ], 35: [ Species.INTELEON ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.VAPOREON, Species.SLOWKING ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUICUNE, Species.MESPRIT ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SWANNA, Species.ARAQUANID ],
      [TimeOfDay.DAY]: [ Species.SWANNA, Species.ARAQUANID ],
      [TimeOfDay.DUSK]: [ Species.AZUMARILL ],
      [TimeOfDay.NIGHT]: [ Species.AZUMARILL ],
      [TimeOfDay.ALL]: [ Species.GOLDUCK, Species.SLOWBRO, Species.SEAKING, Species.GYARADOS, Species.MASQUERAIN, Species.WISHIWASHI, Species.DREDNAW ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLASTOISE, Species.VAPOREON, Species.SLOWKING, Species.SAMUROTT, Species.GRENINJA, Species.INTELEON ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SUICUNE, Species.MESPRIT ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ] },
        Species.REMORAID,
        Species.CLAMPERL,
        Species.BASCULIN,
        { 1: [ Species.FRILLISH ], 40: [ Species.JELLICENT ] },
        { 1: [ Species.ARROKUDA ], 26: [ Species.BARRASKEWDA ] },
        Species.VELUZA
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] },
        Species.SHELLDER,
        { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] },
        Species.LUVDISC,
        { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ] },
        { 1: [ Species.SKRELP ], 48: [ Species.DRAGALGE ] },
        Species.PINCURCHIN,
        Species.DONDOZO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, { 1: [ Species.MANTYKE ], 52: [ Species.MANTINE ] }, Species.ALOMOMOLA, { 1: [ Species.TYNAMO ], 39: [ Species.EELEKTRIK ] }, Species.DHELMISE ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.OMANYTE ], 40: [ Species.OMASTAR ] },
        { 1: [ Species.KABUTO ], 40: [ Species.KABUTOPS ] },
        Species.RELICANTH,
        Species.PYUKUMUKU,
        { 1: [ Species.GALAR_CORSOLA ], 38: [ Species.CURSOLA ] },
        Species.ARCTOVISH,
        Species.HISUI_QWILFISH
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FEEBAS, Species.NIHILEGO ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MILOTIC, Species.NIHILEGO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KYOGRE ] }
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ] },
        { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] },
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ] },
        { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] },
        { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
        { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
        { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] }, { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ] }, { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] }, { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ] }, { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] }, { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] }, { 1: [ Species.SKIDDO ], 32: [ Species.GOGOAT ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
        { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ] },
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
        { 1: [ Species.RUFFLET ], 54: [ Species.BRAVIARY ] },
        { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ] },
        { 1: [ Species.FLITTLE ], 35: [ Species.ESPATHRA ] },
        Species.BOMBIRDIER
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
        { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ] },
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
        { 1: [ Species.RUFFLET ], 54: [ Species.BRAVIARY ] },
        { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ] },
        { 1: [ Species.FLITTLE ], 35: [ Species.ESPATHRA ] },
        Species.BOMBIRDIER
      ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.VULLABY ], 54: [ Species.MANDIBUZZ ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.VULLABY ], 54: [ Species.MANDIBUZZ ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
        { 1: [ Species.NATU ], 25: [ Species.XATU ] },
        { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ] },
        { 1: [ Species.NACLI ], 24: [ Species.NACLSTACK ], 38: [ Species.GARGANACL ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.MURKROW ],
      [TimeOfDay.ALL]: [ Species.SKARMORY, { 1: [ Species.TORCHIC ], 16: [ Species.COMBUSKEN ], 36: [ Species.BLAZIKEN ] }, { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ] }, Species.HAWLUCHA, Species.KLAWF ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ] },
        { 1: [ Species.CRANIDOS ], 30: [ Species.RAMPARDOS ] },
        { 1: [ Species.SHIELDON ], 30: [ Species.BASTIODON ] },
        { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
        Species.ROTOM,
        Species.ARCHEOPS,
        { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ] }
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TORNADUS, Species.TING_LU, Species.OGERPON ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SWELLOW, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.TALONFLAME, Species.CORVIKNIGHT, Species.ESPATHRA ],
      [TimeOfDay.DAY]: [ Species.SWELLOW, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.TALONFLAME, Species.CORVIKNIGHT, Species.ESPATHRA ],
      [TimeOfDay.DUSK]: [ Species.MANDIBUZZ ],
      [TimeOfDay.NIGHT]: [ Species.MANDIBUZZ ],
      [TimeOfDay.ALL]: [ Species.PIDGEOT, Species.FEAROW, Species.SKARMORY, Species.AGGRON, Species.GOGOAT, Species.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.HISUI_BRAVIARY ], [TimeOfDay.DAY]: [ Species.HISUI_BRAVIARY ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLAZIKEN, Species.RAMPARDOS, Species.BASTIODON, Species.HAWLUCHA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM, Species.TORNADUS, Species.TING_LU, Species.OGERPON ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HO_OH ] }
  },
  [Biome.BADLANDS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.DIGLETT ], 26: [ Species.DUGTRIO ] },
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
        { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ] },
        { 1: [ Species.MUDBRAY ], 30: [ Species.MUDSDALE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.SIZZLIPEDE ], 28: [ Species.CENTISKORCH ] }, { 1: [ Species.CAPSAKID ], 30: [ Species.SCOVILLAIN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.SIZZLIPEDE ], 28: [ Species.CENTISKORCH ] }, { 1: [ Species.CAPSAKID ], 30: [ Species.SCOVILLAIN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] },
        { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] },
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
        { 1: [ Species.CUFANT ], 34: [ Species.COPPERAJAH ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ONIX, Species.GLIGAR, { 1: [ Species.POLTCHAGEIST ], 30: [ Species.SINISTCHA ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LANDORUS, Species.OKIDOGI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.DONPHAN, Species.CENTISKORCH, Species.SCOVILLAIN ],
      [TimeOfDay.DAY]: [ Species.DONPHAN, Species.CENTISKORCH, Species.SCOVILLAIN ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.MAROWAK ],
      [TimeOfDay.ALL]: [ Species.DUGTRIO, Species.GOLEM, Species.RHYPERIOR, Species.GLISCOR, Species.EXCADRILL, Species.MUDSDALE, Species.COPPERAJAH ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.STEELIX, Species.SINISTCHA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.LANDORUS, Species.OKIDOGI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GROUDON ] }
  },
  [Biome.CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.ZUBAT ], 22: [ Species.GOLBAT ] },
        { 1: [ Species.PARAS ], 24: [ Species.PARASECT ] },
        { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
        { 1: [ Species.WHISMUR ], 20: [ Species.LOUDRED ], 40: [ Species.EXPLOUD ] },
        { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
        { 1: [ Species.WOOBAT ], 20: [ Species.SWOOBAT ] },
        { 1: [ Species.BUNNELBY ], 20: [ Species.DIGGERSBY ] },
        { 1: [ Species.NACLI ], 24: [ Species.NACLSTACK ], 38: [ Species.GARGANACL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] } ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
        { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] },
        Species.NOSEPASS,
        { 1: [ Species.NOIBAT ], 48: [ Species.NOIVERN ] },
        { 1: [ Species.WIMPOD ], 30: [ Species.GOLISOPOD ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.ONIX, { 1: [ Species.FERROSEED ], 40: [ Species.FERROTHORN ] }, Species.CARBINK, { 1: [ Species.GLIMMET ], 35: [ Species.GLIMMORA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHUCKLE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UXIE ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.PARASECT, Species.ONIX, Species.CROBAT, Species.URSARING, Species.EXPLOUD, Species.PROBOPASS, Species.GIGALITH, Species.SWOOBAT, Species.DIGGERSBY, Species.NOIVERN, Species.GOLISOPOD, Species.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.LYCANROC ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHUCKLE, Species.FERROTHORN, Species.GLIMMORA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UXIE ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERAPAGOS ] }
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ Species.TRAPINCH, { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ] }, { 1: [ Species.RELLOR ], 29: [ Species.RABSCA ] } ],
      [TimeOfDay.DAY]: [ Species.TRAPINCH, { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ] }, { 1: [ Species.RELLOR ], 29: [ Species.RABSCA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ] }, { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ] }, { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] }, { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] }, { 1: [ Species.SILICOBRA ], 36: [ Species.SANDACONDA ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] }, Species.HELIOPTILE ],
      [TimeOfDay.DAY]: [ { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] }, Species.HELIOPTILE ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.MARACTUS, { 1: [ Species.BRAMBLIN ], 30: [ Species.BRAMBLEGHAST ] }, Species.ORTHWORM ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.DARUMAKA ], 35: [ Species.DARMANITAN ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.LILEEP ], 40: [ Species.CRADILY ] }, { 1: [ Species.ANORITH ], 40: [ Species.ARMALDO ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIROCK, Species.TAPU_BULU, Species.PHEROMOSA ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.HIPPOWDON, Species.HELIOLISK, Species.RABSCA ],
      [TimeOfDay.DAY]: [ Species.HIPPOWDON, Species.HELIOLISK, Species.RABSCA ],
      [TimeOfDay.DUSK]: [ Species.CACTURNE, Species.KROOKODILE ],
      [TimeOfDay.NIGHT]: [ Species.CACTURNE, Species.KROOKODILE ],
      [TimeOfDay.ALL]: [ Species.SANDSLASH, Species.DRAPION, Species.DARMANITAN, Species.MARACTUS, Species.SANDACONDA, Species.BRAMBLEGHAST ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CRADILY, Species.ARMALDO ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIROCK, Species.TAPU_BULU, Species.PHEROMOSA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.SEEL ], 34: [ Species.DEWGONG ] },
        { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ] },
        { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ] },
        { 1: [ Species.VANILLITE ], 35: [ Species.VANILLISH ], 47: [ Species.VANILLUXE ] },
        { 1: [ Species.CUBCHOO ], 37: [ Species.BEARTIC ] },
        { 1: [ Species.BERGMITE ], 37: [ Species.AVALUGG ] },
        Species.CRABRAWLER,
        { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.SNEASEL,
        { 1: [ Species.SNORUNT ], 42: [ Species.GLALIE ] },
        { 1: [ Species.SPHEAL ], 32: [ Species.SEALEO ], 44: [ Species.WALREIN ] },
        Species.EISCUE,
        { 1: [ Species.CETODDLE ], 30: [ Species.CETITAN ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JYNX, Species.LAPRAS, Species.FROSLASS, Species.CRYOGONAL ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DELIBIRD, Species.ROTOM, { 1: [ Species.AMAURA ], 59: [ Species.AURORUS ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARTICUNO, Species.REGICE ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.DEWGONG, Species.GLALIE, Species.WALREIN, Species.WEAVILE, Species.MAMOSWINE, Species.FROSLASS, Species.VANILLUXE, Species.BEARTIC, Species.CRYOGONAL, Species.AVALUGG, Species.CRABOMINABLE, Species.CETITAN ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JYNX, Species.LAPRAS, Species.GLACEON, Species.AURORUS ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARTICUNO, Species.REGICE, Species.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KYUREM ] }
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.LEDYBA ], 18: [ Species.LEDIAN ] }, Species.ROSELIA, Species.COTTONEE, Species.MINCCINO ],
      [TimeOfDay.DAY]: [ Species.ROSELIA, Species.COTTONEE, Species.MINCCINO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ] },
        { 1: [ Species.FLABEBE ], 19: [ Species.FLOETTE ] },
        { 1: [ Species.CUTIEFLY ], 25: [ Species.RIBOMBEE ] },
        { 1: [ Species.GOSSIFLEUR ], 20: [ Species.ELDEGOSS ] },
        { 1: [ Species.WOOLOO ], 24: [ Species.DUBWOOL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
        { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ] },
        { 1: [ Species.SKITTY ], 30: [ Species.DELCATTY ] },
        Species.BOUFFALANT,
        { 1: [ Species.SMOLIV ], 25: [ Species.DOLLIV ], 35: [ Species.ARBOLIVA ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
        { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ] },
        { 1: [ Species.SKITTY ], 30: [ Species.DELCATTY ] },
        Species.BOUFFALANT,
        { 1: [ Species.SMOLIV ], 25: [ Species.DOLLIV ], 35: [ Species.ARBOLIVA ] }
      ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ] },
        { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ], 30: [ Species.AMPHAROS ] },
        { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ] },
        { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ] },
        Species.ORICORIO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.VOLBEAT, Species.ILLUMISE ],
      [TimeOfDay.ALL]: [ Species.TAUROS, Species.EEVEE, Species.MILTANK, Species.SPINDA, { 1: [ Species.APPLIN ], 30: [ Species.DIPPLIN ] }, { 1: [ Species.SPRIGATITO ], 16: [ Species.FLORAGATO ], 36: [ Species.MEOWSCARADA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CHANSEY, Species.SYLVEON ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MELOETTA ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.LEDIAN, Species.GRANBULL, Species.DELCATTY, Species.ROSERADE, Species.CINCCINO, Species.BOUFFALANT, Species.ARBOLIVA ],
      [TimeOfDay.DAY]: [ Species.GRANBULL, Species.DELCATTY, Species.ROSERADE, Species.CINCCINO, Species.BOUFFALANT, Species.ARBOLIVA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.TAUROS, Species.MILTANK, Species.GARDEVOIR, Species.PURUGLY, Species.ZEBSTRIKA, Species.FLORGES, Species.RIBOMBEE, Species.DUBWOOL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ Species.HISUI_LILLIGANT ], [TimeOfDay.DAY]: [ Species.HISUI_LILLIGANT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLISSEY, Species.SYLVEON, Species.FLAPPLE, Species.APPLETUN, Species.MEOWSCARADA, Species.HYDRAPPLE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MELOETTA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SHAYMIN ] }
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.PIKACHU,
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
        { 1: [ Species.ELECTRIKE ], 26: [ Species.MANECTRIC ] },
        { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] },
        Species.DEDENNE,
        { 1: [ Species.GRUBBIN ], 20: [ Species.CHARJABUG ] },
        { 1: [ Species.PAWMI ], 18: [ Species.PAWMO ], 32: [ Species.PAWMOT ] },
        { 1: [ Species.TADBULB ], 30: [ Species.BELLIBOLT ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ELECTABUZZ, Species.PLUSLE, Species.MINUN, Species.PACHIRISU, Species.EMOLGA, Species.TOGEDEMARU ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JOLTEON, Species.HISUI_VOLTORB ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.RAICHU, Species.MANECTRIC, Species.LUXRAY, Species.MAGNEZONE, Species.ELECTIVIRE, Species.DEDENNE, Species.VIKAVOLT, Species.TOGEDEMARU, Species.PAWMOT, Species.BELLIBOLT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.JOLTEON, Species.AMPHAROS, Species.HISUI_ELECTRODE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZAPDOS, Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZEKROM ] }
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
        { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
        { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ] },
        { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] },
        { 1: [ Species.SALANDIT ], 33: [ Species.SALAZZLE ] },
        { 1: [ Species.ROLYCOLY ], 18: [ Species.CARKOL ], 34: [ Species.COALOSSAL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MAGMAR, Species.TORKOAL, { 1: [ Species.PANSEAR ], 30: [ Species.SIMISEAR ] }, Species.HEATMOR, Species.TURTONATOR ] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CHARMANDER ], 16: [ Species.CHARMELEON ], 36: [ Species.CHARIZARD ] },
        { 1: [ Species.CYNDAQUIL ], 14: [ Species.QUILAVA ], 36: [ Species.TYPHLOSION ] },
        { 1: [ Species.CHIMCHAR ], 14: [ Species.MONFERNO ], 36: [ Species.INFERNAPE ] },
        { 1: [ Species.TEPIG ], 17: [ Species.PIGNITE ], 36: [ Species.EMBOAR ] },
        { 1: [ Species.FENNEKIN ], 16: [ Species.BRAIXEN ], 36: [ Species.DELPHOX ] },
        { 1: [ Species.LITTEN ], 17: [ Species.TORRACAT ], 34: [ Species.INCINEROAR ] },
        { 1: [ Species.SCORBUNNY ], 16: [ Species.RABOOT ], 35: [ Species.CINDERACE ] },
        { 1: [ Species.CHARCADET ], 30: [ Species.ARMAROUGE ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.FLAREON, Species.ROTOM, { 1: [ Species.LARVESTA ], 59: [ Species.VOLCARONA ] }, Species.HISUI_GROWLITHE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ENTEI, Species.HEATRAN, Species.VOLCANION, Species.CHI_YU ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MOLTRES, Species.ENTEI, Species.ROTOM, Species.HEATRAN, Species.VOLCANION, Species.CHI_YU ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.RESHIRAM ] }
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ] },
        { 1: [ Species.SHUPPET ], 37: [ Species.BANETTE ] },
        { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ] },
        { 1: [ Species.DRIFLOON ], 28: [ Species.DRIFBLIM ] },
        { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ] },
        Species.PHANTUMP,
        Species.PUMPKABOO,
        { 1: [ Species.GREAVARD ], 60: [ Species.HOUNDSTONE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] }, { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] }, { 1: [ Species.SINISTEA ], 30: [ Species.POLTEAGEIST ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MISDREAVUS, Species.MIMIKYU, { 1: [ Species.FUECOCO ], 16: [ Species.CROCALOR ], 36: [ Species.SKELEDIRGE ] }, Species.CERULEDGE ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SPIRITOMB ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MARSHADOW, Species.SPECTRIER ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.MAROWAK ],
      [TimeOfDay.DAY]: [ Species.MAROWAK ],
      [TimeOfDay.DUSK]: [ Species.MAROWAK ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.GENGAR, Species.BANETTE, Species.DRIFBLIM, Species.MISMAGIUS, Species.DUSKNOIR, Species.CHANDELURE, Species.TREVENANT, Species.GOURGEIST, Species.MIMIKYU, Species.POLTEAGEIST, Species.HOUNDSTONE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.SKELEDIRGE, Species.CERULEDGE, Species.HISUI_TYPHLOSION ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MARSHADOW, Species.SPECTRIER ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GIRATINA ] }
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 75: [ Species.ANNIHILAPE ] },
        { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] },
        { 1: [ Species.MEDITITE ], 37: [ Species.MEDICHAM ] },
        { 1: [ Species.STUFFUL ], 27: [ Species.BEWEAR ] },
        { 1: [ Species.CLOBBOPUS ], 55: [ Species.GRAPPLOCT ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] }, { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ] }, { 1: [ Species.MIENFOO ], 50: [ Species.MIENSHAO ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.LUCARIO, Species.THROH, Species.SAWK, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONTOP, Species.GALLADE, Species.GALAR_FARFETCHD ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERRAKION, Species.KUBFU, Species.GALAR_ZAPDOS ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.HARIYAMA, Species.MEDICHAM, Species.LUCARIO, Species.TOXICROAK, Species.THROH, Species.SAWK, Species.SCRAFTY, Species.MIENSHAO, Species.BEWEAR, Species.GRAPPLOCT, Species.ANNIHILAPE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HITMONTOP, Species.GALLADE, Species.PANGORO, Species.SIRFETCHD, Species.HISUI_DECIDUEYE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TERRAKION, Species.URSHIFU ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZAMAZENTA, Species.GALAR_ZAPDOS ] }
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
        { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] },
        { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, Species.KLEFKI ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GENESECT, Species.MAGEARNA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KLINKLANG, Species.KLEFKI ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GENESECT, Species.MAGEARNA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.RUINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.DROWZEE ], 26: [ Species.HYPNO ] },
        { 1: [ Species.NATU ], 25: [ Species.XATU ] },
        Species.UNOWN,
        { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ] },
        { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] },
        { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] }, Species.SIGILYPH, { 1: [ Species.TINKATINK ], 24: [ Species.TINKATUFF ], 38: [ Species.TINKATON ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MR_MIME, Species.WOBBUFFET, { 1: [ Species.GOTHITA ], 32: [ Species.GOTHORITA ], 41: [ Species.GOTHITELLE ] }, Species.STONJOURNER ] },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ Species.ESPEON ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.GALAR_YAMASK ], 34: [ Species.RUNERIGUS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.GALAR_YAMASK ], 34: [ Species.RUNERIGUS ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.ARCHEN ], 37: [ Species.ARCHEOPS ] } ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGISTEEL, Species.FEZANDIPITI ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ALAKAZAM, Species.HYPNO, Species.XATU, Species.GRUMPIG, Species.CLAYDOL, Species.SIGILYPH, Species.GOTHITELLE, Species.BEHEEYEM, Species.TINKATON ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.ESPEON ], [TimeOfDay.DUSK]: [ Species.RUNERIGUS ], [TimeOfDay.NIGHT]: [ Species.RUNERIGUS ], [TimeOfDay.ALL]: [ Species.MR_MIME, Species.WOBBUFFET, Species.ARCHEOPS ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGISTEEL, Species.FEZANDIPITI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KORAIDON ] }
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ] },
        { 1: [ Species.GOOMY ], 40: [ Species.SLIGGOO ], 80: [ Species.GOODRA ] },
        { 1: [ Species.JANGMO_O ], 35: [ Species.HAKAMO_O ], 45: [ Species.KOMMO_O ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ] },
        { 1: [ Species.GOOMY ], 40: [ Species.SLIGGOO ], 80: [ Species.GOODRA ] },
        { 1: [ Species.JANGMO_O ], 35: [ Species.HAKAMO_O ], 45: [ Species.KOMMO_O ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] },
        { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
        { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ], 48: [ Species.HAXORUS ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] }, Species.DRAMPA, Species.CYCLIZAR ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.DREEPY ], 50: [ Species.DRAKLOAK ], 60: [ Species.DRAGAPULT ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.DREEPY ], 50: [ Species.DRAKLOAK ], 60: [ Species.DRAGAPULT ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.DRATINI ], 30: [ Species.DRAGONAIR ], 55: [ Species.DRAGONITE ] }, { 1: [ Species.FRIGIBAX ], 35: [ Species.ARCTIBAX ], 54: [ Species.BAXCALIBUR ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AERODACTYL, Species.DRUDDIGON, { 1: [ Species.TYRUNT ], 59: [ Species.TYRANTRUM ] }, Species.DRACOZOLT, Species.DRACOVISH ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIDRAGO ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.SALAMENCE, Species.GOODRA, Species.KOMMO_O ],
      [TimeOfDay.DAY]: [ Species.SALAMENCE, Species.GOODRA, Species.KOMMO_O ],
      [TimeOfDay.DUSK]: [ Species.TYRANITAR, Species.DRAGAPULT ],
      [TimeOfDay.NIGHT]: [ Species.TYRANITAR, Species.DRAGAPULT ],
      [TimeOfDay.ALL]: [ Species.DRAGONITE, Species.FLYGON, Species.GARCHOMP, Species.HAXORUS, Species.DRAMPA, Species.BAXCALIBUR ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AERODACTYL, Species.DRUDDIGON, Species.TYRANTRUM, Species.DRACOZOLT, Species.DRACOVISH ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIDRAGO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIALGA ] }
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        Species.MURKROW,
        { 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ] },
        Species.SABLEYE,
        { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] },
        { 1: [ Species.PAWNIARD ], 52: [ Species.BISHARP ], 64: [ Species.KINGAMBIT ] },
        { 1: [ Species.NICKIT ], 18: [ Species.THIEVUL ] },
        { 1: [ Species.IMPIDIMP ], 32: [ Species.MORGREM ], 42: [ Species.GRIMMSNARL ] },
        { 1: [ Species.MASCHIFF ], 30: [ Species.MABOSSTIFF ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.ABSOL, Species.SPIRITOMB, { 1: [ Species.ZORUA ], 30: [ Species.ZOROARK ] }, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UMBREON ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DARKRAI, Species.GALAR_MOLTRES ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.HOUNDOOM, Species.SABLEYE, Species.ABSOL, Species.HONCHKROW, Species.SPIRITOMB, Species.LIEPARD, Species.ZOROARK, Species.HYDREIGON, Species.THIEVUL, Species.GRIMMSNARL, Species.MABOSSTIFF, Species.KINGAMBIT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.UMBREON, Species.HISUI_SAMUROTT ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DARKRAI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.PALKIA, Species.YVELTAL, Species.GALAR_MOLTRES ] }
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ Species.SOLROCK ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ Species.LUNATONE ],
      [TimeOfDay.ALL]: [ Species.CLEFAIRY, { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, { 1: [ Species.MUNNA ], 30: [ Species.MUSHARNA ] }, Species.MINIOR ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] }, { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ] } ] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] }, Species.SIGILYPH, { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.COSMOG ], 43: [ Species.COSMOEM ] }, Species.CELESTEELA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.SOLROCK ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.LUNATONE ], [TimeOfDay.ALL]: [ Species.CLEFABLE, Species.BRONZONG, Species.MUSHARNA, Species.REUNICLUS, Species.MINIOR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.METAGROSS, Species.PORYGON_Z ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CELESTEELA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ Species.SOLGALEO ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ Species.LUNALA ], [TimeOfDay.ALL]: [ Species.RAYQUAZA, Species.NECROZMA ] }
  },
  [Biome.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
        { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ] },
        { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
        { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ] },
        { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
        { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ { 1: [ Species.GALAR_MEOWTH ], 28: [ Species.PERRSERKER ] } ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ONIX, Species.HITMONLEE, Species.HITMONCHAN, Species.DURALUDON ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, Species.HITMONTOP ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.COBALION, Species.STAKATAKA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MACHAMP, Species.CONKELDURR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.PERRSERKER ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ARCHALUDON ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.COBALION, Species.STAKATAKA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.JUNGLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ Species.VESPIQUEN, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] }, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] } ],
      [TimeOfDay.DAY]: [ Species.VESPIQUEN, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] }, { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] } ],
      [TimeOfDay.DUSK]: [ Species.SHROOMISH, { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] }, { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] }, Species.SHROOMISH, { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] }, { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] } ],
      [TimeOfDay.ALL]: [ Species.AIPOM, { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ] }, { 1: [ Species.PIKIPEK ], 14: [ Species.TRUMBEAK ], 28: [ Species.TOUCANNON ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.EXEGGCUTE, Species.TROPIUS, Species.COMBEE, Species.KOMALA ],
      [TimeOfDay.DAY]: [ Species.EXEGGCUTE, Species.TROPIUS, Species.COMBEE, Species.KOMALA ],
      [TimeOfDay.DUSK]: [ Species.TANGELA, { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] }, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ] } ],
      [TimeOfDay.NIGHT]: [ Species.TANGELA, { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.PANSAGE ], 30: [ Species.SIMISAGE ] },
        { 1: [ Species.PANSEAR ], 30: [ Species.SIMISEAR ] },
        { 1: [ Species.PANPOUR ], 30: [ Species.SIMIPOUR ] },
        { 1: [ Species.JOLTIK ], 36: [ Species.GALVANTULA ] },
        { 1: [ Species.LITLEO ], 35: [ Species.PYROAR ] },
        { 1: [ Species.FOMANTIS ], 44: [ Species.LURANTIS ] },
        Species.FALINKS
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] }, Species.PASSIMIAN, { 1: [ Species.GALAR_PONYTA ], 40: [ Species.GALAR_RAPIDASH ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] }, Species.PASSIMIAN ],
      [TimeOfDay.DUSK]: [ Species.ORANGURU ],
      [TimeOfDay.NIGHT]: [ Species.ORANGURU ],
      [TimeOfDay.ALL]: [
        Species.SCYTHER,
        Species.YANMA,
        { 1: [ Species.SLAKOTH ], 18: [ Species.VIGOROTH ], 36: [ Species.SLAKING ] },
        Species.SEVIPER,
        Species.CARNIVINE,
        { 1: [ Species.SNIVY ], 17: [ Species.SERVINE ], 36: [ Species.SERPERIOR ] },
        { 1: [ Species.GROOKEY ], 16: [ Species.THWACKEY ], 35: [ Species.RILLABOOM ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KANGASKHAN, Species.CHATOT, Species.KLEAVOR ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TAPU_LELE, Species.BUZZWOLE, Species.ZARUDE, Species.MUNKIDORI ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TAPU_LELE, Species.BUZZWOLE, Species.ZARUDE, Species.MUNKIDORI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.KLEAVOR ] }
  },
  [Biome.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ] },
        { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] },
        Species.MAWILE,
        { 1: [ Species.SPRITZEE ], 40: [ Species.AROMATISSE ] },
        { 1: [ Species.SWIRLIX ], 40: [ Species.SLURPUFF ] },
        { 1: [ Species.CUTIEFLY ], 25: [ Species.RIBOMBEE ] },
        { 1: [ Species.MORELULL ], 24: [ Species.SHIINOTIC ] },
        { 1: [ Species.MILCERY ], 30: [ Species.ALCREMIE ] }
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
        { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ] },
        Species.CARBINK,
        Species.COMFEY,
        { 1: [ Species.HATENNA ], 32: [ Species.HATTREM ], 42: [ Species.HATTERENE ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.AUDINO, Species.ETERNAL_FLOETTE ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIANCIE, Species.ENAMORUS ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.WIGGLYTUFF, Species.MAWILE, Species.TOGEKISS, Species.AUDINO, Species.AROMATISSE, Species.SLURPUFF, Species.CARBINK, Species.RIBOMBEE, Species.SHIINOTIC, Species.COMFEY, Species.HATTERENE, Species.ALCREMIE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ETERNAL_FLOETTE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DIANCIE, Species.ENAMORUS ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.XERNEAS ] }
  },
  [Biome.TEMPLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ] },
        { 1: [ Species.NATU ], 25: [ Species.XATU ] },
        { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ] },
        { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] },
        { 1: [ Species.GOLETT ], 43: [ Species.GOLURK ] },
        { 1: [ Species.HONEDGE ], 35: [ Species.DOUBLADE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] },
        { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] },
        { 1: [ Species.CHINGLING ], 20: [ Species.CHIMECHO ] },
        { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
        { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.GIMMIGHOUL ], 40: [ Species.GHOLDENGO ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HOOPA, Species.TAPU_KOKO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.CHIMECHO, Species.COFAGRIGUS, Species.GOLURK, Species.AEGISLASH ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GHOLDENGO ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.HOOPA, Species.TAPU_KOKO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.REGIGIGAS ] }
  },
  [Biome.SLUM]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ] },
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
        { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ] },
        { 1: [ Species.TRUBBISH ], 36: [ Species.GARBODOR ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] } ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ Species.TOXTRICITY, { 1: [ Species.GALAR_LINOONE ], 65: [ Species.OBSTAGOON ] }, Species.GALAR_ZIGZAGOON ],
      [TimeOfDay.NIGHT]: [ Species.TOXTRICITY, { 1: [ Species.GALAR_LINOONE ], 65: [ Species.OBSTAGOON ] }, Species.GALAR_ZIGZAGOON ],
      [TimeOfDay.ALL]: [ { 1: [ Species.VAROOM ], 40: [ Species.REVAVROOM ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GUZZLORD ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.SKUNTANK, Species.WATCHOG ], [TimeOfDay.NIGHT]: [ Species.SKUNTANK, Species.WATCHOG ], [TimeOfDay.ALL]: [ Species.MUK, Species.WEEZING, Species.WORMADAM, Species.GARBODOR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ Species.TOXTRICITY, Species.OBSTAGOON ], [TimeOfDay.NIGHT]: [ Species.TOXTRICITY, Species.OBSTAGOON ], [TimeOfDay.ALL]: [ Species.REVAVROOM, Species.GALAR_WEEZING ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GUZZLORD ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] }, { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ] } ],
      [TimeOfDay.NIGHT]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] }, { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ] }, { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ] }, Species.EISCUE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] }, Species.STANTLER ],
      [TimeOfDay.DAY]: [ Species.SNEASEL, { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] }, Species.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ Species.GALAR_DARUMAKA ], 30: [ Species.GALAR_DARMANITAN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ Species.GALAR_DARUMAKA ], 30: [ Species.GALAR_DARMANITAN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ Species.DELIBIRD, { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ] }, { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ Species.HISUI_SNEASEL ],
      [TimeOfDay.DAY]: [ Species.HISUI_SNEASEL ],
      [TimeOfDay.DUSK]: [ { 1: [ Species.HISUI_ZORUA ], 30: [ Species.HISUI_ZOROARK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.HISUI_ZORUA ], 30: [ Species.HISUI_ZOROARK ] } ],
      [TimeOfDay.ALL]: [ { 1: [ Species.GALAR_MR_MIME ], 42: [ Species.MR_RIME ] }, Species.ARCTOZOLT, Species.HISUI_AVALUGG ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GLASTRIER, Species.CHIEN_PAO, Species.GALAR_ARTICUNO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ Species.WYRDEER ], [TimeOfDay.DAY]: [ Species.WYRDEER ], [TimeOfDay.DUSK]: [ Species.FROSMOTH ], [TimeOfDay.NIGHT]: [ Species.FROSMOTH ], [TimeOfDay.ALL]: [ Species.ABOMASNOW, Species.URSALUNA ] },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ Species.SNEASLER, Species.GALAR_DARMANITAN ],
      [TimeOfDay.DAY]: [ Species.SNEASLER, Species.GALAR_DARMANITAN ],
      [TimeOfDay.DUSK]: [ Species.HISUI_ZOROARK ],
      [TimeOfDay.NIGHT]: [ Species.HISUI_ZOROARK ],
      [TimeOfDay.ALL]: [ Species.MR_RIME, Species.ARCTOZOLT, Species.ALOLA_SANDSLASH, Species.ALOLA_NINETALES ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.GLASTRIER, Species.CHIEN_PAO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ZACIAN, Species.GALAR_ARTICUNO ] }
  },
  [Biome.ISLAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ Species.ALOLA_RATTATA ], 30: [ Species.ALOLA_RATICATE ] }, { 1: [ Species.ALOLA_MEOWTH ], 30: [ Species.ALOLA_PERSIAN ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ Species.ALOLA_RATTATA ], 30: [ Species.ALOLA_RATICATE ] }, { 1: [ Species.ALOLA_MEOWTH ], 30: [ Species.ALOLA_PERSIAN ] } ],
      [TimeOfDay.ALL]: [
        Species.ORICORIO,
        { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ] },
        { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ] },
        { 1: [ Species.ALOLA_DIGLETT ], 26: [ Species.ALOLA_DUGTRIO ] },
        { 1: [ Species.ALOLA_GEODUDE ], 25: [ Species.ALOLA_GRAVELER ], 40: [ Species.ALOLA_GOLEM ] },
        { 1: [ Species.ALOLA_GRIMER ], 38: [ Species.ALOLA_MUK ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ Species.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ Species.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ Species.BRUXISH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLACEPHALON ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ Species.ALOLA_RATICATE, Species.ALOLA_PERSIAN, Species.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ Species.ALOLA_RATICATE, Species.ALOLA_PERSIAN, Species.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ Species.ORICORIO, Species.BRUXISH, Species.ALOLA_SANDSLASH, Species.ALOLA_NINETALES, Species.ALOLA_DUGTRIO, Species.ALOLA_GOLEM, Species.ALOLA_MUK ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.BLACEPHALON ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [Biome.LABORATORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
        { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
        { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
        { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] },
        { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ] } ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.DITTO, { 1: [ Species.PORYGON ], 30: [ Species.PORYGON2 ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.TYPE_NULL ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MUK, Species.ELECTRODE, Species.BRONZONG, Species.MAGNEZONE, Species.PORYGON_Z, Species.REUNICLUS, Species.KLINKLANG ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROTOM, Species.ZYGARDE, Species.SILVALLY ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.MEWTWO, Species.MIRAIDON ] }
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
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ROARING_MOON, Species.IRON_VALIANT ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.WALKING_WAKE, Species.IRON_LEAVES, Species.GOUGING_FIRE, Species.RAGING_BOLT, Species.IRON_BOULDER, Species.IRON_CROWN ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ Species.ETERNATUS ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
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
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.CLERK, TrainerType.CYCLIST, TrainerType.OFFICER, TrainerType.WAITER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BREEDER, TrainerType.DEPOT_AGENT, TrainerType.GUITARIST ],
    [BiomePoolTier.RARE]: [ TrainerType.ARTIST ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.SWIMMER ],
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
    [BiomePoolTier.COMMON]: [],
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
    [BiomePoolTier.COMMON]: [ TrainerType.FISHERMAN, TrainerType.PARASOL_LADY ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.FISHERMAN ],
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
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.SCIENTIST ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER ],
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
    [BiomePoolTier.COMMON]: [],
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
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT ],
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
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BAKER ],
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
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
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

export function initBiomes() {
  const pokemonBiomes = [
    [ Species.BULBASAUR, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IVYSAUR, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VENUSAUR, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CHARMANDER, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHARMELEON, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHARIZARD, Type.FIRE, Type.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SQUIRTLE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.WARTORTLE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BLASTOISE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CATERPIE, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.METAPOD, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BUTTERFREE, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.WEEDLE, Type.BUG, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.KAKUNA, Type.BUG, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.BEEDRILL, Type.BUG, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PIDGEY, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PIDGEOTTO, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PIDGEOT, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.RATTATA, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RATICATE, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SPEAROW, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FEAROW, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.EKANS, Type.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ARBOK, Type.POISON, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PIKACHU, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RAICHU, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SANDSHREW, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDSLASH, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NIDORAN_F, Type.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORINA, Type.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDOQUEEN, Type.POISON, Type.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORAN_M, Type.POISON, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDORINO, Type.POISON, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.NIDOKING, Type.POISON, Type.GROUND, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.CLEFAIRY, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CLEFABLE, Type.FAIRY, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VULPIX, Type.FIRE, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NINETALES, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.JIGGLYPUFF, Type.NORMAL, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WIGGLYTUFF, Type.NORMAL, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ZUBAT, Type.POISON, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLBAT, Type.POISON, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ODDISH, Type.GRASS, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.GLOOM, Type.GRASS, Type.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.VILEPLUME, Type.GRASS, Type.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PARAS, Type.BUG, Type.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PARASECT, Type.BUG, Type.GRASS, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VENONAT, Type.BUG, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.VENOMOTH, Type.BUG, Type.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.DIGLETT, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUGTRIO, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEOWTH, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PERSIAN, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PSYDUCK, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLDUCK, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MANKEY, Type.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PRIMEAPE, Type.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GROWLITHE, Type.FIRE, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ARCANINE, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.POLIWAG, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.POLIWHIRL, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.POLIWRATH, Type.WATER, Type.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ABRA, Type.PSYCHIC, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KADABRA, Type.PSYCHIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ALAKAZAM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MACHOP, Type.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MACHOKE, Type.FIGHTING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MACHAMP, Type.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BELLSPROUT, Type.GRASS, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.WEEPINBELL, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VICTREEBEL, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TENTACOOL, Type.WATER, Type.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TENTACRUEL, Type.WATER, Type.POISON, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GEODUDE, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GRAVELER, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLEM, Type.ROCK, Type.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PONYTA, Type.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RAPIDASH, Type.FIRE, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SLOWPOKE, Type.WATER, Type.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SLOWBRO, Type.WATER, Type.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGNEMITE, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAGNETON, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FARFETCHD, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DODUO, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.DODRIO, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SEEL, Type.WATER, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DEWGONG, Type.WATER, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GRIMER, Type.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUK, Type.POISON, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHELLDER, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CLOYSTER, Type.WATER, Type.ICE, [
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.GASTLY, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HAUNTER, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GENGAR, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ONIX, Type.ROCK, Type.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DROWZEE, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HYPNO, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KRABBY, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KINGLER, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VOLTORB, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ELECTRODE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.EXEGGCUTE, Type.GRASS, Type.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.EXEGGUTOR, Type.GRASS, Type.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CUBONE, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MAROWAK, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, TimeOfDay.NIGHT ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY, TimeOfDay.DUSK ] ]
    ]
    ],
    [ Species.HITMONLEE, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.HITMONCHAN, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.LICKITUNG, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.KOFFING, Type.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WEEZING, Type.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.RHYHORN, Type.GROUND, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.RHYDON, Type.GROUND, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CHANSEY, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TANGELA, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.KANGASKHAN, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HORSEA, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEADRA, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLDEEN, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEAKING, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.STARYU, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.STARMIE, Type.WATER, Type.PSYCHIC, [
      [ Biome.BEACH, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BEACH, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.MR_MIME, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SCYTHER, Type.BUG, Type.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.JYNX, Type.ICE, Type.PSYCHIC, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ELECTABUZZ, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MAGMAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PINSIR, Type.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TAUROS, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGIKARP, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GYARADOS, Type.WATER, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LAPRAS, Type.WATER, Type.ICE, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DITTO, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EEVEE, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VAPOREON, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.JOLTEON, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FLAREON, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PORYGON, Type.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.OMANYTE, Type.ROCK, Type.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.OMASTAR, Type.ROCK, Type.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KABUTO, Type.ROCK, Type.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.KABUTOPS, Type.ROCK, Type.WATER, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.AERODACTYL, Type.ROCK, Type.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNORLAX, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARTICUNO, Type.ICE, Type.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZAPDOS, Type.ELECTRIC, Type.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MOLTRES, Type.FIRE, Type.FLYING, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DRATINI, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRAGONAIR, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRAGONITE, Type.DRAGON, Type.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEWTWO, Type.PSYCHIC, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MEW, Type.PSYCHIC, -1, [ ]
    ],
    [ Species.CHIKORITA, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BAYLEEF, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MEGANIUM, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CYNDAQUIL, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUILAVA, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TYPHLOSION, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TOTODILE, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CROCONAW, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FERALIGATR, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SENTRET, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FURRET, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HOOTHOOT, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.NOCTOWL, Type.NORMAL, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LEDYBA, Type.BUG, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.LEDIAN, Type.BUG, Type.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.COMMON, TimeOfDay.DAWN ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.SPINARAK, Type.BUG, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ARIADOS, Type.BUG, Type.POISON, [
      [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.CROBAT, Type.POISON, Type.FLYING, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHINCHOU, Type.WATER, Type.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LANTURN, Type.WATER, Type.ELECTRIC, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PICHU, Type.ELECTRIC, -1, [ ]
    ],
    [ Species.CLEFFA, Type.FAIRY, -1, [ ]
    ],
    [ Species.IGGLYBUFF, Type.NORMAL, Type.FAIRY, [ ]
    ],
    [ Species.TOGEPI, Type.FAIRY, -1, [ ]
    ],
    [ Species.TOGETIC, Type.FAIRY, Type.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.NATU, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.XATU, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAREEP, Type.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLAAFFY, Type.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.AMPHAROS, Type.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BELLOSSOM, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.MARILL, Type.WATER, Type.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AZUMARILL, Type.WATER, Type.FAIRY, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
    ]
    ],
    [ Species.SUDOWOODO, Type.ROCK, -1, [
      [ Biome.GRASS, BiomePoolTier.SUPER_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POLITOED, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HOPPIP, Type.GRASS, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SKIPLOOM, Type.GRASS, Type.FLYING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.JUMPLUFF, Type.GRASS, Type.FLYING, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.AIPOM, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SUNKERN, Type.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SUNFLORA, Type.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.YANMA, Type.BUG, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.WOOPER, Type.WATER, Type.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.QUAGSIRE, Type.WATER, Type.GROUND, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ESPEON, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, TimeOfDay.DAY ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ Species.UMBREON, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MURKROW, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLOWKING, Type.WATER, Type.PSYCHIC, [
      [ Biome.LAKE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MISDREAVUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.UNOWN, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WOBBUFFET, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GIRAFARIG, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PINECO, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.FORRETRESS, Type.BUG, Type.STEEL, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.DUNSPARCE, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GLIGAR, Type.GROUND, Type.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.STEELIX, Type.STEEL, Type.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNUBBULL, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GRANBULL, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.QWILFISH, Type.WATER, Type.POISON, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SCIZOR, Type.BUG, Type.STEEL, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SHUCKLE, Type.BUG, Type.ROCK, [
      [ Biome.CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HERACROSS, Type.BUG, Type.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNEASEL, Type.DARK, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TEDDIURSA, Type.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.URSARING, Type.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SLUGMA, Type.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MAGCARGO, Type.FIRE, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SWINUB, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PILOSWINE, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CORSOLA, Type.WATER, Type.ROCK, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.REMORAID, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.OCTILLERY, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DELIBIRD, Type.ICE, Type.FLYING, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MANTINE, Type.WATER, Type.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKARMORY, Type.STEEL, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HOUNDOUR, Type.DARK, Type.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HOUNDOOM, Type.DARK, Type.FIRE, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KINGDRA, Type.WATER, Type.DRAGON, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PHANPY, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.DONPHAN, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PORYGON2, Type.NORMAL, -1, [
      [ Biome.FACTORY, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.STANTLER, Type.NORMAL, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SMEARGLE, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TYROGUE, Type.FIGHTING, -1, [ ]
    ],
    [ Species.HITMONTOP, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.SMOOCHUM, Type.ICE, Type.PSYCHIC, [ ]
    ],
    [ Species.ELEKID, Type.ELECTRIC, -1, [ ]
    ],
    [ Species.MAGBY, Type.FIRE, -1, [ ]
    ],
    [ Species.MILTANK, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BLISSEY, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RAIKOU, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ENTEI, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SUICUNE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LARVITAR, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PUPITAR, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.TYRANITAR, Type.ROCK, Type.DARK, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.LUGIA, Type.PSYCHIC, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.HO_OH, Type.FIRE, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.CELEBI, Type.PSYCHIC, Type.GRASS, [ ]
    ],
    [ Species.TREECKO, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GROVYLE, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SCEPTILE, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TORCHIC, Type.FIRE, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.COMBUSKEN, Type.FIRE, Type.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BLAZIKEN, Type.FIRE, Type.FIGHTING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MUDKIP, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MARSHTOMP, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SWAMPERT, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POOCHYENA, Type.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.MIGHTYENA, Type.DARK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ZIGZAGOON, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LINOONE, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WURMPLE, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SILCOON, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.DAY ]
    ]
    ],
    [ Species.BEAUTIFLY, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.CASCOON, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.DUSTOX, Type.BUG, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LOTAD, Type.WATER, Type.GRASS, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.LOMBRE, Type.WATER, Type.GRASS, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.LUDICOLO, Type.WATER, Type.GRASS, [
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SEEDOT, Type.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.NUZLEAF, Type.GRASS, Type.DARK, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SHIFTRY, Type.GRASS, Type.DARK, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.TAILLOW, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SWELLOW, Type.NORMAL, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.WINGULL, Type.WATER, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PELIPPER, Type.WATER, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.RALTS, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KIRLIA, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GARDEVOIR, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SURSKIT, Type.BUG, Type.WATER, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MASQUERAIN, Type.BUG, Type.FLYING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHROOMISH, Type.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.BRELOOM, Type.GRASS, Type.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SLAKOTH, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.VIGOROTH, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SLAKING, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.NINCADA, Type.BUG, Type.GROUND, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NINJASK, Type.BUG, Type.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHEDINJA, Type.BUG, Type.GHOST, [
      [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.WHISMUR, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LOUDRED, Type.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.EXPLOUD, Type.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAKUHITA, Type.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HARIYAMA, Type.FIGHTING, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.AZURILL, Type.NORMAL, Type.FAIRY, [ ]
    ],
    [ Species.NOSEPASS, Type.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SKITTY, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.DELCATTY, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SABLEYE, Type.DARK, Type.GHOST, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAWILE, Type.STEEL, Type.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ARON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.LAIRON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.AGGRON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MEDITITE, Type.FIGHTING, Type.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MEDICHAM, Type.FIGHTING, Type.PSYCHIC, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ELECTRIKE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MANECTRIC, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PLUSLE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MINUN, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.VOLBEAT, Type.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ILLUMISE, Type.BUG, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.ROSELIA, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GULPIN, Type.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SWALOT, Type.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARVANHA, Type.WATER, Type.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SHARPEDO, Type.WATER, Type.DARK, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.WAILMER, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WAILORD, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NUMEL, Type.FIRE, Type.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CAMERUPT, Type.FIRE, Type.GROUND, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TORKOAL, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPOINK, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRUMPIG, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPINDA, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TRAPINCH, Type.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VIBRAVA, Type.GROUND, Type.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLYGON, Type.GROUND, Type.DRAGON, [
      [ Biome.DESERT, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ],
    ]
    ],
    [ Species.CACNEA, Type.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.CACTURNE, Type.GRASS, Type.DARK, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SWABLU, Type.NORMAL, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ALTARIA, Type.DRAGON, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ZANGOOSE, Type.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SEVIPER, Type.POISON, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LUNATONE, Type.ROCK, Type.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.SOLROCK, Type.ROCK, Type.PSYCHIC, [
      [ Biome.SPACE, BiomePoolTier.COMMON, TimeOfDay.DAY ],
      [ Biome.SPACE, BiomePoolTier.BOSS, TimeOfDay.DAY ]
    ]
    ],
    [ Species.BARBOACH, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WHISCASH, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CORPHISH, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRAWDAUNT, Type.WATER, Type.DARK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BALTOY, Type.GROUND, Type.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
    ]
    ],
    [ Species.CLAYDOL, Type.GROUND, Type.PSYCHIC, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
    ]
    ],
    [ Species.LILEEP, Type.ROCK, Type.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.CRADILY, Type.ROCK, Type.GRASS, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ANORITH, Type.ROCK, Type.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.ARMALDO, Type.ROCK, Type.BUG, [
      [ Biome.DESERT, BiomePoolTier.SUPER_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FEEBAS, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.MILOTIC, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CASTFORM, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KECLEON, Type.NORMAL, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHUPPET, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BANETTE, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUSKULL, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUSCLOPS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TROPIUS, Type.GRASS, Type.FLYING, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CHIMECHO, Type.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ABSOL, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WYNAUT, Type.PSYCHIC, -1, [ ]
    ],
    [ Species.SNORUNT, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GLALIE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPHEAL, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SEALEO, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WALREIN, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLAMPERL, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HUNTAIL, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOREBYSS, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.RELICANTH, Type.WATER, Type.ROCK, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LUVDISC, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BAGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SHELGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SALAMENCE, Type.DRAGON, Type.FLYING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BELDUM, Type.STEEL, Type.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.METANG, Type.STEEL, Type.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.METAGROSS, Type.STEEL, Type.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.REGIROCK, Type.ROCK, -1, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGICE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGISTEEL, Type.STEEL, -1, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LATIAS, Type.DRAGON, Type.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.LATIOS, Type.DRAGON, Type.PSYCHIC, [
      [ Biome.PLAINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KYOGRE, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GROUDON, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.RAYQUAZA, Type.DRAGON, Type.FLYING, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.JIRACHI, Type.STEEL, Type.PSYCHIC, [ ]
    ],
    [ Species.DEOXYS, Type.PSYCHIC, -1, [ ]
    ],
    [ Species.TURTWIG, Type.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GROTLE, Type.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TORTERRA, Type.GRASS, Type.GROUND, [
      [ Biome.GRASS, BiomePoolTier.RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CHIMCHAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MONFERNO, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INFERNAPE, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PIPLUP, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PRINPLUP, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EMPOLEON, Type.WATER, Type.STEEL, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.STARLY, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.STARAVIA, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.STARAPTOR, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BIDOOF, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BIBAREL, Type.NORMAL, Type.WATER, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KRICKETOT, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.KRICKETUNE, Type.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SHINX, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LUXIO, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LUXRAY, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BUDEW, Type.GRASS, Type.POISON, [ ]
    ],
    [ Species.ROSERADE, Type.GRASS, Type.POISON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CRANIDOS, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.RAMPARDOS, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SHIELDON, Type.ROCK, Type.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.BASTIODON, Type.ROCK, Type.STEEL, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BURMY, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.WORMADAM, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MOTHIM, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.COMBEE, Type.BUG, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VESPIQUEN, Type.BUG, Type.FLYING, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PACHIRISU, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BUIZEL, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLOATZEL, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHERUBI, Type.GRASS, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CHERRIM, Type.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SHELLOS, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GASTRODON, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ],
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.AMBIPOM, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRIFLOON, Type.GHOST, Type.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DRIFBLIM, Type.GHOST, Type.FLYING, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BUNEARY, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.LOPUNNY, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MISMAGIUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HONCHKROW, Type.DARK, Type.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GLAMEOW, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PURUGLY, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHINGLING, Type.PSYCHIC, -1, [
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.STUNKY, Type.POISON, Type.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SKUNTANK, Type.POISON, Type.DARK, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.BRONZOR, Type.STEEL, Type.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BRONZONG, Type.STEEL, Type.PSYCHIC, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BONSLY, Type.ROCK, -1, [ ]
    ],
    [ Species.MIME_JR, Type.PSYCHIC, Type.FAIRY, [ ]
    ],
    [ Species.HAPPINY, Type.NORMAL, -1, [ ]
    ],
    [ Species.CHATOT, Type.NORMAL, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.SPIRITOMB, Type.GHOST, Type.DARK, [
      [ Biome.GRAVEYARD, BiomePoolTier.SUPER_RARE ],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GIBLE, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GABITE, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARCHOMP, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MUNCHLAX, Type.NORMAL, -1, [ ]
    ],
    [ Species.RIOLU, Type.FIGHTING, -1, [ ]
    ],
    [ Species.LUCARIO, Type.FIGHTING, Type.STEEL, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HIPPOPOTAS, Type.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HIPPOWDON, Type.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SKORUPI, Type.POISON, Type.BUG, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
    ]
    ],
    [ Species.DRAPION, Type.POISON, Type.DARK, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
    ]
    ],
    [ Species.CROAGUNK, Type.POISON, Type.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TOXICROAK, Type.POISON, Type.FIGHTING, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARNIVINE, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FINNEON, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.LUMINEON, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, TimeOfDay.NIGHT ],
      [ Biome.SEA, BiomePoolTier.BOSS, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.MANTYKE, Type.WATER, Type.FLYING, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SNOVER, Type.GRASS, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ABOMASNOW, Type.GRASS, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WEAVILE, Type.DARK, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGNEZONE, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LICKILICKY, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RHYPERIOR, Type.GROUND, Type.ROCK, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TANGROWTH, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ELECTIVIRE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAGMORTAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOGEKISS, Type.FAIRY, Type.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YANMEGA, Type.BUG, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LEAFEON, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GLACEON, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GLISCOR, Type.GROUND, Type.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAMOSWINE, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PORYGON_Z, Type.NORMAL, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_RARE ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GALLADE, Type.PSYCHIC, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PROBOPASS, Type.ROCK, Type.STEEL, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUSKNOIR, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FROSLASS, Type.ICE, Type.GHOST, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ROTOM, Type.ELECTRIC, Type.GHOST, [
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
    [ Species.UXIE, Type.PSYCHIC, -1, [
      [ Biome.CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MESPRIT, Type.PSYCHIC, -1, [
      [ Biome.LAKE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.AZELF, Type.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DIALGA, Type.STEEL, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.PALKIA, Type.WATER, Type.DRAGON, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.HEATRAN, Type.FIRE, Type.STEEL, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIGIGAS, Type.NORMAL, -1, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GIRATINA, Type.GHOST, Type.DRAGON, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.CRESSELIA, Type.PSYCHIC, -1, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.PHIONE, Type.WATER, -1, [ ]
    ],
    [ Species.MANAPHY, Type.WATER, -1, [ ]
    ],
    [ Species.DARKRAI, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SHAYMIN, Type.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ARCEUS, Type.NORMAL, -1, [ ]
    ],
    [ Species.VICTINI, Type.PSYCHIC, Type.FIRE, [ ]
    ],
    [ Species.SNIVY, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SERVINE, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SERPERIOR, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TEPIG, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PIGNITE, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EMBOAR, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.OSHAWOTT, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DEWOTT, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SAMUROTT, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PATRAT, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.WATCHOG, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.LILLIPUP, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HERDIER, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.STOUTLAND, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PURRLOIN, Type.DARK, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.LIEPARD, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PANSAGE, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMISAGE, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PANSEAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMISEAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PANPOUR, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIMIPOUR, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MUNNA, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUSHARNA, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PIDOVE, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TRANQUILL, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.UNFEZANT, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BLITZLE, Type.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ZEBSTRIKA, Type.ELECTRIC, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ROGGENROLA, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOLDORE, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GIGALITH, Type.ROCK, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WOOBAT, Type.PSYCHIC, Type.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SWOOBAT, Type.PSYCHIC, Type.FLYING, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRILBUR, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.EXCADRILL, Type.GROUND, Type.STEEL, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AUDINO, Type.NORMAL, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TIMBURR, Type.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GURDURR, Type.FIGHTING, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CONKELDURR, Type.FIGHTING, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TYMPOLE, Type.WATER, -1, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PALPITOAD, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SEISMITOAD, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.THROH, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SAWK, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SEWADDLE, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SWADLOON, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.LEAVANNY, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VENIPEDE, Type.BUG, Type.POISON, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.WHIRLIPEDE, Type.BUG, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SCOLIPEDE, Type.BUG, Type.POISON, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.COTTONEE, Type.GRASS, Type.FAIRY, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.WHIMSICOTT, Type.GRASS, Type.FAIRY, [
      [ Biome.GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PETILIL, Type.GRASS, -1, [
      [ Biome.GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.LILLIGANT, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BASCULIN, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDILE, Type.GROUND, Type.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.KROKOROK, Type.GROUND, Type.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.KROOKODILE, Type.GROUND, Type.DARK, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.DARUMAKA, Type.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DARMANITAN, Type.FIRE, -1, [
      [ Biome.DESERT, BiomePoolTier.RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MARACTUS, Type.GRASS, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DWEBBLE, Type.BUG, Type.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRUSTLE, Type.BUG, Type.ROCK, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SCRAGGY, Type.DARK, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SCRAFTY, Type.DARK, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SIGILYPH, Type.PSYCHIC, Type.FLYING, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.YAMASK, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.COFAGRIGUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TIRTOUGA, Type.WATER, Type.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.CARRACOSTA, Type.WATER, Type.ROCK, [
      [ Biome.SEA, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.SUPER_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCHEN, Type.ROCK, Type.FLYING, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.ARCHEOPS, Type.ROCK, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TRUBBISH, Type.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARBODOR, Type.POISON, -1, [
      [ Biome.SLUM, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ZORUA, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ZOROARK, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MINCCINO, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CINCCINO, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
    ]
    ],
    [ Species.GOTHITA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GOTHORITA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GOTHITELLE, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SOLOSIS, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DUOSION, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.REUNICLUS, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.UNCOMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DUCKLETT, Type.WATER, Type.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SWANNA, Type.WATER, Type.FLYING, [
      [ Biome.LAKE, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VANILLITE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VANILLISH, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VANILLUXE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DEERLING, Type.NORMAL, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SAWSBUCK, Type.NORMAL, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.EMOLGA, Type.ELECTRIC, Type.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KARRABLAST, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ESCAVALIER, Type.BUG, Type.STEEL, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FOONGUS, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.AMOONGUSS, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.FRILLISH, Type.WATER, Type.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.JELLICENT, Type.WATER, Type.GHOST, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOMOMOLA, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.JOLTIK, Type.BUG, Type.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
    ]
    ],
    [ Species.GALVANTULA, Type.BUG, Type.ELECTRIC, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FERROSEED, Type.GRASS, Type.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FERROTHORN, Type.GRASS, Type.STEEL, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KLINK, Type.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KLANG, Type.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.KLINKLANG, Type.STEEL, -1, [
      [ Biome.FACTORY, BiomePoolTier.COMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ],
      [ Biome.LABORATORY, BiomePoolTier.COMMON ],
      [ Biome.LABORATORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TYNAMO, Type.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EELEKTRIK, Type.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EELEKTROSS, Type.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ELGYEM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BEHEEYEM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ],
      [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LITWICK, Type.GHOST, Type.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LAMPENT, Type.GHOST, Type.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CHANDELURE, Type.GHOST, Type.FIRE, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.AXEW, Type.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FRAXURE, Type.DRAGON, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HAXORUS, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CUBCHOO, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BEARTIC, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRYOGONAL, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHELMET, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ACCELGOR, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.STUNFISK, Type.GROUND, Type.ELECTRIC, [
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MIENFOO, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.MIENSHAO, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRUDDIGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GOLETT, Type.GROUND, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOLURK, Type.GROUND, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PAWNIARD, Type.DARK, Type.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BISHARP, Type.DARK, Type.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOUFFALANT, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.RUFFLET, Type.NORMAL, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BRAVIARY, Type.NORMAL, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VULLABY, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.MANDIBUZZ, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.HEATMOR, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DURANT, Type.BUG, Type.STEEL, [
      [ Biome.FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DEINO, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ZWEILOUS, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ABYSS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.HYDREIGON, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ABYSS, BiomePoolTier.RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.LARVESTA, Type.BUG, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.VOLCARONA, Type.BUG, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.COBALION, Type.STEEL, Type.FIGHTING, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TERRAKION, Type.ROCK, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.VIRIZION, Type.GRASS, Type.FIGHTING, [
      [ Biome.GRASS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRASS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TORNADUS, Type.FLYING, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.THUNDURUS, Type.ELECTRIC, Type.FLYING, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.RESHIRAM, Type.DRAGON, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZEKROM, Type.DRAGON, Type.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.LANDORUS, Type.GROUND, Type.FLYING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KYUREM, Type.DRAGON, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.KELDEO, Type.WATER, Type.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MELOETTA, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.MEADOW, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GENESECT, Type.BUG, Type.STEEL, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHESPIN, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUILLADIN, Type.GRASS, -1, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CHESNAUGHT, Type.GRASS, Type.FIGHTING, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FENNEKIN, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BRAIXEN, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DELPHOX, Type.FIRE, Type.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FROAKIE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FROGADIER, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GRENINJA, Type.WATER, Type.DARK, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.BUNNELBY, Type.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DIGGERSBY, Type.NORMAL, Type.GROUND, [
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLETCHLING, Type.NORMAL, Type.FLYING, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FLETCHINDER, Type.FIRE, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TALONFLAME, Type.FIRE, Type.FLYING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SCATTERBUG, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SPEWPA, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VIVILLON, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.LITLEO, Type.FIRE, Type.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PYROAR, Type.FIRE, Type.NORMAL, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLABEBE, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLOETTE, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLORGES, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKIDDO, Type.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOGOAT, Type.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PANCHAM, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PANGORO, Type.FIGHTING, Type.DARK, [
      [ Biome.DOJO, BiomePoolTier.RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.FURFROU, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ESPURR, Type.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.MEOWSTIC, Type.PSYCHIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.HONEDGE, Type.STEEL, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DOUBLADE, Type.STEEL, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AEGISLASH, Type.STEEL, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SPRITZEE, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AROMATISSE, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SWIRLIX, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLURPUFF, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.INKAY, Type.DARK, Type.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.MALAMAR, Type.DARK, Type.PSYCHIC, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.BINACLE, Type.ROCK, Type.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BARBARACLE, Type.ROCK, Type.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SKRELP, Type.POISON, Type.WATER, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DRAGALGE, Type.POISON, Type.DRAGON, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLAUNCHER, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CLAWITZER, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HELIOPTILE, Type.ELECTRIC, Type.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HELIOLISK, Type.ELECTRIC, Type.NORMAL, [
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TYRUNT, Type.ROCK, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.TYRANTRUM, Type.ROCK, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.AMAURA, Type.ROCK, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.AURORUS, Type.ROCK, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SYLVEON, Type.FAIRY, -1, [
      [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HAWLUCHA, Type.FIGHTING, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DEDENNE, Type.ELECTRIC, Type.FAIRY, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CARBINK, Type.ROCK, Type.FAIRY, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOOMY, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SLIGGOO, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GOODRA, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.KLEFKI, Type.STEEL, Type.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
      [ Biome.FACTORY, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PHANTUMP, Type.GHOST, Type.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TREVENANT, Type.GHOST, Type.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PUMPKABOO, Type.GHOST, Type.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GOURGEIST, Type.GHOST, Type.GRASS, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BERGMITE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.AVALUGG, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NOIBAT, Type.FLYING, Type.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.NOIVERN, Type.FLYING, Type.DRAGON, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.XERNEAS, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.YVELTAL, Type.DARK, Type.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZYGARDE, Type.DRAGON, Type.GROUND, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.DIANCIE, Type.ROCK, Type.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.HOOPA, Type.PSYCHIC, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.VOLCANION, Type.FIRE, Type.WATER, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ROWLET, Type.GRASS, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DARTRIX, Type.GRASS, Type.FLYING, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DECIDUEYE, Type.GRASS, Type.GHOST, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LITTEN, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TORRACAT, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INCINEROAR, Type.FIRE, Type.DARK, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.POPPLIO, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BRIONNE, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.PRIMARINA, Type.WATER, Type.FAIRY, [
      [ Biome.SEA, BiomePoolTier.RARE ],
      [ Biome.SEA, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PIKIPEK, Type.NORMAL, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TRUMBEAK, Type.NORMAL, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.TOUCANNON, Type.NORMAL, Type.FLYING, [
      [ Biome.JUNGLE, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YUNGOOS, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GUMSHOOS, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GRUBBIN, Type.BUG, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CHARJABUG, Type.BUG, Type.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.VIKAVOLT, Type.BUG, Type.ELECTRIC, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRABRAWLER, Type.FIGHTING, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CRABOMINABLE, Type.FIGHTING, Type.ICE, [
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ORICORIO, Type.FIRE, Type.FLYING, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CUTIEFLY, Type.BUG, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.RIBOMBEE, Type.BUG, Type.FAIRY, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ROCKRUFF, Type.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.LYCANROC, Type.ROCK, -1, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, TimeOfDay.DAY ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, TimeOfDay.DAY ],
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, TimeOfDay.NIGHT ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE, TimeOfDay.NIGHT ],
      [ Biome.CAVE, BiomePoolTier.UNCOMMON, TimeOfDay.DUSK ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.WISHIWASHI, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MAREANIE, Type.POISON, Type.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TOXAPEX, Type.POISON, Type.WATER, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ],
      [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
      [ Biome.SWAMP, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MUDBRAY, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MUDSDALE, Type.GROUND, -1, [
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DEWPIDER, Type.WATER, Type.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ARAQUANID, Type.WATER, Type.BUG, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.LAKE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FOMANTIS, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.LURANTIS, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MORELULL, Type.GRASS, Type.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SHIINOTIC, Type.GRASS, Type.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SALANDIT, Type.POISON, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SALAZZLE, Type.POISON, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.STUFFUL, Type.NORMAL, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BEWEAR, Type.NORMAL, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BOUNSWEET, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.STEENEE, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TSAREENA, Type.GRASS, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.COMFEY, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ORANGURU, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PASSIMIAN, Type.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.WIMPOD, Type.BUG, Type.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GOLISOPOD, Type.BUG, Type.WATER, [
      [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SANDYGAST, Type.GHOST, Type.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.PALOSSAND, Type.GHOST, Type.GROUND, [
      [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
      [ Biome.BEACH, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PYUKUMUKU, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TYPE_NULL, Type.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.SILVALLY, Type.NORMAL, -1, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MINIOR, Type.ROCK, Type.FLYING, [
      [ Biome.SPACE, BiomePoolTier.COMMON ],
      [ Biome.SPACE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KOMALA, Type.NORMAL, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TURTONATOR, Type.FIRE, Type.DRAGON, [
      [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOGEDEMARU, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MIMIKYU, Type.GHOST, Type.FAIRY, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BRUXISH, Type.WATER, Type.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRAMPA, Type.NORMAL, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DHELMISE, Type.GHOST, Type.GRASS, [
      [ Biome.SEABED, BiomePoolTier.RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.JANGMO_O, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HAKAMO_O, Type.DRAGON, Type.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.KOMMO_O, Type.DRAGON, Type.FIGHTING, [
      [ Biome.WASTELAND, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TAPU_KOKO, Type.ELECTRIC, Type.FAIRY, [
      [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_LELE, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_BULU, Type.GRASS, Type.FAIRY, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TAPU_FINI, Type.WATER, Type.FAIRY, [
      [ Biome.BEACH, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.COSMOG, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.COSMOEM, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.SOLGALEO, Type.PSYCHIC, Type.STEEL, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.DAY ]
    ]
    ],
    [ Species.LUNALA, Type.PSYCHIC, Type.GHOST, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE, TimeOfDay.NIGHT ]
    ]
    ],
    [ Species.NIHILEGO, Type.ROCK, Type.POISON, [
      [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.BUZZWOLE, Type.BUG, Type.FIGHTING, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.PHEROMOSA, Type.BUG, Type.FIGHTING, [
      [ Biome.DESERT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DESERT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.XURKITREE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CELESTEELA, Type.STEEL, Type.FLYING, [
      [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.KARTANA, Type.GRASS, Type.STEEL, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GUZZLORD, Type.DARK, Type.DRAGON, [
      [ Biome.SLUM, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.NECROZMA, Type.PSYCHIC, -1, [
      [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MAGEARNA, Type.STEEL, Type.FAIRY, [
      [ Biome.FACTORY, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MARSHADOW, Type.FIGHTING, Type.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.POIPOLE, Type.POISON, -1, [
      [ Biome.SWAMP, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.NAGANADEL, Type.POISON, Type.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.STAKATAKA, Type.ROCK, Type.STEEL, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.BLACEPHALON, Type.FIRE, Type.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ISLAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZERAORA, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MELTAN, Type.STEEL, -1, [ ]
    ],
    [ Species.MELMETAL, Type.STEEL, -1, [ ]
    ],
    [ Species.GROOKEY, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.THWACKEY, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RILLABOOM, Type.GRASS, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SCORBUNNY, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RABOOT, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CINDERACE, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SOBBLE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DRIZZILE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.INTELEON, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.RARE ],
      [ Biome.LAKE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SKWOVET, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GREEDENT, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ROOKIDEE, Type.FLYING, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE ],
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CORVISQUIRE, Type.FLYING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CORVIKNIGHT, Type.FLYING, Type.STEEL, [
      [ Biome.PLAINS, BiomePoolTier.RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BLIPBUG, Type.BUG, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.DOTTLER, Type.BUG, Type.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ORBEETLE, Type.BUG, Type.PSYCHIC, [
      [ Biome.FOREST, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.NICKIT, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.THIEVUL, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GOSSIFLEUR, Type.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ELDEGOSS, Type.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WOOLOO, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DUBWOOL, Type.NORMAL, -1, [
      [ Biome.MEADOW, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHEWTLE, Type.WATER, -1, [
      [ Biome.LAKE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DREDNAW, Type.WATER, Type.ROCK, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.LAKE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.YAMPER, Type.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.BOLTUND, Type.ELECTRIC, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ROLYCOLY, Type.ROCK, -1, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.CARKOL, Type.ROCK, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.COALOSSAL, Type.ROCK, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.COMMON ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.APPLIN, Type.GRASS, Type.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLAPPLE, Type.GRASS, Type.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.APPLETUN, Type.GRASS, Type.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SILICOBRA, Type.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDACONDA, Type.GROUND, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CRAMORANT, Type.FLYING, Type.WATER, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ARROKUDA, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BARRASKEWDA, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.COMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOXEL, Type.ELECTRIC, Type.POISON, [ ]
    ],
    [ Species.TOXTRICITY, Type.ELECTRIC, Type.POISON, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.SIZZLIPEDE, Type.FIRE, Type.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CENTISKORCH, Type.FIRE, Type.BUG, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.CLOBBOPUS, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRAPPLOCT, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SINISTEA, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.POLTEAGEIST, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.HATENNA, Type.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.HATTREM, Type.PSYCHIC, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.HATTERENE, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.IMPIDIMP, Type.DARK, Type.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MORGREM, Type.DARK, Type.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRIMMSNARL, Type.DARK, Type.FAIRY, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.OBSTAGOON, Type.DARK, Type.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.PERRSERKER, Type.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.CURSOLA, Type.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SIRFETCHD, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.MR_RIME, Type.ICE, Type.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.RUNERIGUS, Type.GROUND, Type.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.RUINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.MILCERY, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALCREMIE, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FALINKS, Type.FIGHTING, -1, [
      [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PINCURCHIN, Type.ELECTRIC, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.SNOM, Type.ICE, Type.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.FROSMOTH, Type.ICE, Type.BUG, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.STONJOURNER, Type.ROCK, -1, [
      [ Biome.RUINS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.EISCUE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.INDEEDEE, Type.PSYCHIC, Type.NORMAL, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.MORPEKO, Type.ELECTRIC, Type.DARK, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.CUFANT, Type.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.COPPERAJAH, Type.STEEL, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.DRACOZOLT, Type.ELECTRIC, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCTOZOLT, Type.ELECTRIC, Type.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DRACOVISH, Type.WATER, Type.DRAGON, [
      [ Biome.WASTELAND, BiomePoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ARCTOVISH, Type.WATER, Type.ICE, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DURALUDON, Type.STEEL, Type.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DREEPY, Type.DRAGON, Type.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.DRAKLOAK, Type.DRAGON, Type.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.DRAGAPULT, Type.DRAGON, Type.GHOST, [
      [ Biome.WASTELAND, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ZACIAN, Type.FAIRY, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ZAMAZENTA, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.ETERNATUS, Type.POISON, Type.DRAGON, [
      [ Biome.END, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.KUBFU, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ]
    ]
    ],
    [ Species.URSHIFU, Type.FIGHTING, Type.DARK, [
      [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ZARUDE, Type.DARK, Type.GRASS, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIELEKI, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.REGIDRAGO, Type.DRAGON, -1, [
      [ Biome.WASTELAND, BiomePoolTier.ULTRA_RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.GLASTRIER, Type.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SPECTRIER, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.ULTRA_RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CALYREX, Type.PSYCHIC, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.WYRDEER, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.KLEAVOR, Type.BUG, Type.ROCK, [
      [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.URSALUNA, Type.GROUND, Type.NORMAL, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BASCULEGION, Type.WATER, Type.GHOST, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.SNEASLER, Type.FIGHTING, Type.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.OVERQWIL, Type.DARK, Type.POISON, [
      [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ENAMORUS, Type.FAIRY, Type.FLYING, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.SPRIGATITO, Type.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.FLORAGATO, Type.GRASS, -1, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.MEOWSCARADA, Type.GRASS, Type.DARK, [
      [ Biome.MEADOW, BiomePoolTier.RARE ],
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.FUECOCO, Type.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CROCALOR, Type.FIRE, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SKELEDIRGE, Type.FIRE, Type.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.QUAXLY, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUAXWELL, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.QUAQUAVAL, Type.WATER, Type.FIGHTING, [
      [ Biome.BEACH, BiomePoolTier.RARE ],
      [ Biome.BEACH, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.LECHONK, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.OINKOLOGNE, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.COMMON ],
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TAROUNTULA, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SPIDOPS, Type.BUG, -1, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.NYMBLE, Type.BUG, -1, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.LOKIX, Type.BUG, Type.DARK, [
      [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.PAWMI, Type.ELECTRIC, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PAWMO, Type.ELECTRIC, Type.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.PAWMOT, Type.ELECTRIC, Type.FIGHTING, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TANDEMAUS, Type.NORMAL, -1, [
      [ Biome.TOWN, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.MAUSHOLD, Type.NORMAL, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FIDOUGH, Type.FAIRY, -1, [
      [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.DACHSBUN, Type.FAIRY, -1, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SMOLIV, Type.GRASS, Type.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.DOLLIV, Type.GRASS, Type.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ARBOLIVA, Type.GRASS, Type.NORMAL, [
      [ Biome.MEADOW, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MEADOW, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SQUAWKABILLY, Type.NORMAL, Type.FLYING, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.NACLI, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.NACLSTACK, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GARGANACL, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CHARCADET, Type.FIRE, -1, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ARMAROUGE, Type.FIRE, Type.PSYCHIC, [
      [ Biome.VOLCANO, BiomePoolTier.RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CERULEDGE, Type.FIRE, Type.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.TADBULB, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BELLIBOLT, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WATTREL, Type.ELECTRIC, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KILOWATTREL, Type.ELECTRIC, Type.FLYING, [
      [ Biome.SEA, BiomePoolTier.UNCOMMON ],
      [ Biome.SEA, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.MASCHIFF, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.MABOSSTIFF, Type.DARK, -1, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.SHROODLE, Type.POISON, Type.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.GRAFAIAI, Type.POISON, Type.NORMAL, [
      [ Biome.FOREST, BiomePoolTier.COMMON ],
      [ Biome.FOREST, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.BRAMBLIN, Type.GRASS, Type.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.BRAMBLEGHAST, Type.GRASS, Type.GHOST, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
      [ Biome.DESERT, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TOEDSCOOL, Type.GROUND, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TOEDSCRUEL, Type.GROUND, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KLAWF, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.CAPSAKID, Type.GRASS, -1, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.SCOVILLAIN, Type.GRASS, Type.FIRE, [
      [ Biome.BADLANDS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.RELLOR, Type.BUG, -1, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.RABSCA, Type.BUG, Type.PSYCHIC, [
      [ Biome.DESERT, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.DESERT, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FLITTLE, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ESPATHRA, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.TINKATINK, Type.FAIRY, Type.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TINKATUFF, Type.FAIRY, Type.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.TINKATON, Type.FAIRY, Type.STEEL, [
      [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
      [ Biome.RUINS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.WIGLETT, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.WUGTRIO, Type.WATER, -1, [
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BOMBIRDIER, Type.FLYING, Type.DARK, [
      [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.FINIZEN, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PALAFIN, Type.WATER, -1, [
      [ Biome.SEA, BiomePoolTier.COMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SEA, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.VAROOM, Type.STEEL, Type.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.REVAVROOM, Type.STEEL, Type.POISON, [
      [ Biome.METROPOLIS, BiomePoolTier.RARE ],
      [ Biome.METROPOLIS, BiomePoolTier.BOSS_RARE ],
      [ Biome.SLUM, BiomePoolTier.RARE ],
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.CYCLIZAR, Type.DRAGON, Type.NORMAL, [
      [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.ORTHWORM, Type.STEEL, -1, [
      [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.GLIMMET, Type.ROCK, Type.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GLIMMORA, Type.ROCK, Type.POISON, [
      [ Biome.CAVE, BiomePoolTier.RARE ],
      [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GREAVARD, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.HOUNDSTONE, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.FLAMIGO, Type.FLYING, Type.FIGHTING, [
      [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CETODDLE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.CETITAN, Type.ICE, -1, [
      [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.VELUZA, Type.WATER, Type.PSYCHIC, [
      [ Biome.SEABED, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.DONDOZO, Type.WATER, -1, [
      [ Biome.SEABED, BiomePoolTier.UNCOMMON ],
      [ Biome.SEABED, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.TATSUGIRI, Type.DRAGON, Type.WATER, [
      [ Biome.BEACH, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ANNIHILAPE, Type.FIGHTING, Type.GHOST, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.DOJO, BiomePoolTier.COMMON ],
      [ Biome.DOJO, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.CLODSIRE, Type.POISON, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SWAMP, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.FARIGIRAF, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
      [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.DUDUNSPARCE, Type.NORMAL, -1, [
      [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.KINGAMBIT, Type.DARK, Type.STEEL, [
      [ Biome.ABYSS, BiomePoolTier.COMMON ],
      [ Biome.ABYSS, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GREAT_TUSK, Type.GROUND, Type.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SCREAM_TAIL, Type.FAIRY, Type.PSYCHIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.BRUTE_BONNET, Type.GRASS, Type.DARK, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FLUTTER_MANE, Type.GHOST, Type.FAIRY, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SLITHER_WING, Type.BUG, Type.FIGHTING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.SANDY_SHOCKS, Type.ELECTRIC, Type.GROUND, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_TREADS, Type.GROUND, Type.STEEL, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_BUNDLE, Type.ICE, Type.WATER, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_HANDS, Type.FIGHTING, Type.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_JUGULIS, Type.DARK, Type.FLYING, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_MOTH, Type.FIRE, Type.POISON, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.IRON_THORNS, Type.ROCK, Type.ELECTRIC, [
      [ Biome.END, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.FRIGIBAX, Type.DRAGON, Type.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ARCTIBAX, Type.DRAGON, Type.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.BAXCALIBUR, Type.DRAGON, Type.ICE, [
      [ Biome.WASTELAND, BiomePoolTier.RARE ],
      [ Biome.WASTELAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.GIMMIGHOUL, Type.GHOST, -1, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.GHOLDENGO, Type.STEEL, Type.GHOST, [
      [ Biome.TEMPLE, BiomePoolTier.RARE ],
      [ Biome.TEMPLE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.WO_CHIEN, Type.DARK, Type.GRASS, [
      [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHIEN_PAO, Type.DARK, Type.ICE, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.TING_LU, Type.DARK, Type.GROUND, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.CHI_YU, Type.DARK, Type.FIRE, [
      [ Biome.VOLCANO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ROARING_MOON, Type.DRAGON, Type.DARK, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.IRON_VALIANT, Type.FAIRY, Type.FIGHTING, [
      [ Biome.END, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ Species.KORAIDON, Type.FIGHTING, Type.DRAGON, [
      [ Biome.RUINS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.MIRAIDON, Type.ELECTRIC, Type.DRAGON, [
      [ Biome.LABORATORY, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.WALKING_WAKE, Type.WATER, Type.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_LEAVES, Type.GRASS, Type.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.DIPPLIN, Type.GRASS, Type.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.POLTCHAGEIST, Type.GRASS, Type.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.SINISTCHA, Type.GRASS, Type.GHOST, [
      [ Biome.BADLANDS, BiomePoolTier.RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.OKIDOGI, Type.POISON, Type.FIGHTING, [
      [ Biome.BADLANDS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.BADLANDS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.MUNKIDORI, Type.POISON, Type.PSYCHIC, [
      [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.FEZANDIPITI, Type.POISON, Type.FAIRY, [
      [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.OGERPON, Type.GRASS, -1, [
      [ Biome.MOUNTAIN, BiomePoolTier.ULTRA_RARE ],
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_SUPER_RARE ]
    ]
    ],
    [ Species.ARCHALUDON, Type.STEEL, Type.DRAGON, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HYDRAPPLE, Type.GRASS, Type.DRAGON, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GOUGING_FIRE, Type.FIRE, Type.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.RAGING_BOLT, Type.ELECTRIC, Type.DRAGON, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_BOULDER, Type.ROCK, Type.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.IRON_CROWN, Type.STEEL, Type.PSYCHIC, [
      [ Biome.END, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.TERAPAGOS, Type.NORMAL, -1, [
      [ Biome.CAVE, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.PECHARUNT, Type.POISON, Type.GHOST, [ ]
    ],
    [ Species.ALOLA_RATTATA, Type.DARK, Type.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ALOLA_RATICATE, Type.DARK, Type.NORMAL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ALOLA_RAICHU, Type.ELECTRIC, Type.PSYCHIC, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ALOLA_SANDSHREW, Type.ICE, Type.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ALOLA_SANDSLASH, Type.ICE, Type.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ALOLA_VULPIX, Type.ICE, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
    ]
    ],
    [ Species.ALOLA_NINETALES, Type.ICE, Type.FAIRY, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.ALOLA_DIGLETT, Type.GROUND, Type.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_DUGTRIO, Type.GROUND, Type.STEEL, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_MEOWTH, Type.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ALOLA_PERSIAN, Type.DARK, -1, [
      [ Biome.ISLAND, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ALOLA_GEODUDE, Type.ROCK, Type.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_GRAVELER, Type.ROCK, Type.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_GOLEM, Type.ROCK, Type.ELECTRIC, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_GRIMER, Type.POISON, Type.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ]
    ]
    ],
    [ Species.ALOLA_MUK, Type.POISON, Type.DARK, [
      [ Biome.ISLAND, BiomePoolTier.COMMON ],
      [ Biome.ISLAND, BiomePoolTier.BOSS ]
    ]
    ],
    [ Species.ALOLA_EXEGGUTOR, Type.GRASS, Type.DRAGON, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.ALOLA_MAROWAK, Type.FIRE, Type.GHOST, [
      [ Biome.ISLAND, BiomePoolTier.UNCOMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.ISLAND, BiomePoolTier.BOSS, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.ETERNAL_FLOETTE, Type.FAIRY, -1, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.RARE ],
      [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GALAR_MEOWTH, Type.STEEL, -1, [
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.RARE, TimeOfDay.DUSK ]
    ]
    ],
    [ Species.GALAR_PONYTA, Type.PSYCHIC, -1, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.GALAR_RAPIDASH, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.JUNGLE, BiomePoolTier.RARE, TimeOfDay.DAWN ],
      [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE, TimeOfDay.DAWN ]
    ]
    ],
    [ Species.GALAR_SLOWPOKE, Type.PSYCHIC, -1, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GALAR_SLOWBRO, Type.POISON, Type.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GALAR_FARFETCHD, Type.FIGHTING, -1, [
      [ Biome.DOJO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_WEEZING, Type.POISON, Type.FAIRY, [
      [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.GALAR_MR_MIME, Type.ICE, Type.PSYCHIC, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_ARTICUNO, Type.PSYCHIC, Type.FLYING, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.ULTRA_RARE ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_ZAPDOS, Type.FIGHTING, Type.FLYING, [
      [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
      [ Biome.DOJO, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_MOLTRES, Type.DARK, Type.FLYING, [
      [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
      [ Biome.ABYSS, BiomePoolTier.BOSS_ULTRA_RARE ]
    ]
    ],
    [ Species.GALAR_SLOWKING, Type.POISON, Type.PSYCHIC, [
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GALAR_CORSOLA, Type.GHOST, -1, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.GALAR_ZIGZAGOON, Type.DARK, Type.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.GALAR_LINOONE, Type.DARK, Type.NORMAL, [
      [ Biome.SLUM, BiomePoolTier.RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.GALAR_DARUMAKA, Type.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GALAR_DARMANITAN, Type.ICE, -1, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.GALAR_YAMASK, Type.GROUND, Type.GHOST, [
      [ Biome.RUINS, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.GALAR_STUNFISK, Type.GROUND, Type.STEEL, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_GROWLITHE, Type.FIRE, Type.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_ARCANINE, Type.FIRE, Type.ROCK, [
      [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_VOLTORB, Type.ELECTRIC, Type.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_ELECTRODE, Type.ELECTRIC, Type.GRASS, [
      [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_TYPHLOSION, Type.FIRE, Type.GHOST, [
      [ Biome.GRAVEYARD, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_QWILFISH, Type.DARK, Type.POISON, [
      [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_SNEASEL, Type.FIGHTING, Type.POISON, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HISUI_SAMUROTT, Type.WATER, Type.DARK, [
      [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.HISUI_LILLIGANT, Type.GRASS, Type.FIGHTING, [
      [ Biome.MEADOW, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HISUI_ZORUA, Type.NORMAL, Type.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.HISUI_ZOROARK, Type.NORMAL, Type.GHOST, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.HISUI_BRAVIARY, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HISUI_SLIGGOO, Type.STEEL, Type.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HISUI_GOODRA, Type.STEEL, Type.DRAGON, [
      [ Biome.SWAMP, BiomePoolTier.SUPER_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.SWAMP, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.HISUI_AVALUGG, Type.ICE, Type.ROCK, [
      [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
    ]
    ],
    [ Species.HISUI_DECIDUEYE, Type.GRASS, Type.FIGHTING, [
      [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
    ]
    ],
    [ Species.PALDEA_TAUROS, Type.FIGHTING, -1, [
      [ Biome.PLAINS, BiomePoolTier.RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ],
      [ Biome.PLAINS, BiomePoolTier.BOSS_RARE, [ TimeOfDay.DAWN, TimeOfDay.DAY ] ]
    ]
    ],
    [ Species.PALDEA_WOOPER, Type.POISON, Type.GROUND, [
      [ Biome.SWAMP, BiomePoolTier.COMMON, [ TimeOfDay.DUSK, TimeOfDay.NIGHT ] ]
    ]
    ],
    [ Species.BLOODMOON_URSALUNA, Type.GROUND, Type.NORMAL, [
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
    [ TrainerType.BACKERS, [] ],
    [ TrainerType.BACKPACKER, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ],
      [ Biome.JUNGLE, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.BAKER, [
      [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
    ]
    ],
    [ TrainerType.BEAUTY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ] ],
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
    ] ],
    [ TrainerType.CYCLIST, [
      [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.DANCER, [] ],
    [ TrainerType.DEPOT_AGENT, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
    ] ],
    [ TrainerType.DOCTOR, [] ],
    [ TrainerType.FISHERMAN, [
      [ Biome.LAKE, BiomePoolTier.COMMON ],
      [ Biome.BEACH, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.RICH, [] ],
    [ TrainerType.GUITARIST, [
      [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
    ] ],
    [ TrainerType.HARLEQUIN, [] ],
    [ TrainerType.HIKER, [
      [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
      [ Biome.CAVE, BiomePoolTier.COMMON ],
      [ Biome.BADLANDS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.HOOLIGANS, [] ],
    [ TrainerType.HOOPSTER, [] ],
    [ TrainerType.INFIELDER, [] ],
    [ TrainerType.JANITOR, [] ],
    [ TrainerType.LINEBACKER, [] ],
    [ TrainerType.MAID, [] ],
    [ TrainerType.MUSICIAN, [] ],
    [ TrainerType.NURSERY_AIDE, [] ],
    [ TrainerType.OFFICER, [
      [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
      [ Biome.CONSTRUCTION_SITE, BiomePoolTier.COMMON ],
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.PARASOL_LADY, [
      [ Biome.BEACH, BiomePoolTier.COMMON ],
      [ Biome.MEADOW, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.PILOT, [] ],
    [ TrainerType.POKEFAN, [] ],
    [ TrainerType.PRESCHOOLER, [] ],
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
    [ TrainerType.RICH_KID, [] ],
    [ TrainerType.ROUGHNECK, [
      [ Biome.SLUM, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SCIENTIST, [
      [ Biome.DESERT, BiomePoolTier.COMMON ],
      [ Biome.RUINS, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.SMASHER, [] ],
    [ TrainerType.SNOW_WORKER, [
      [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
      [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
    ]
    ],
    [ TrainerType.STRIKER, [] ],
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
    [ TrainerType.HEX_MANIAC, [
      [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
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
    [ TrainerType.LORELEI, [] ],
    [ TrainerType.BRUNO, [] ],
    [ TrainerType.AGATHA, [] ],
    [ TrainerType.LANCE, [] ],
    [ TrainerType.WILL, [] ],
    [ TrainerType.KOGA, [] ],
    [ TrainerType.KAREN, [] ],
    [ TrainerType.SIDNEY, [] ],
    [ TrainerType.PHOEBE, [] ],
    [ TrainerType.GLACIA, [] ],
    [ TrainerType.DRAKE, [] ],
    [ TrainerType.AARON, [] ],
    [ TrainerType.BERTHA, [] ],
    [ TrainerType.FLINT, [] ],
    [ TrainerType.LUCIAN, [] ],
    [ TrainerType.SHAUNTAL, [] ],
    [ TrainerType.MARSHAL, [] ],
    [ TrainerType.GRIMSLEY, [] ],
    [ TrainerType.CAITLIN, [] ],
    [ TrainerType.MALVA, [] ],
    [ TrainerType.SIEBOLD, [] ],
    [ TrainerType.WIKSTROM, [] ],
    [ TrainerType.DRASNA, [] ],
    [ TrainerType.HALA, [] ],
    [ TrainerType.MOLAYNE, [] ],
    [ TrainerType.OLIVIA, [] ],
    [ TrainerType.ACEROLA, [] ],
    [ TrainerType.KAHILI, [] ],
    [ TrainerType.RIKA, [] ],
    [ TrainerType.POPPY, [] ],
    [ TrainerType.LARRY_ELITE, [] ],
    [ TrainerType.HASSEL, [] ],
    [ TrainerType.CRISPIN, [] ],
    [ TrainerType.AMARYS, [] ],
    [ TrainerType.LACEY, [] ],
    [ TrainerType.DRAYTON, [] ],
    [ TrainerType.BLUE, [] ],
    [ TrainerType.RED, [] ],
    [ TrainerType.LANCE_CHAMPION, [] ],
    [ TrainerType.STEVEN, [] ],
    [ TrainerType.WALLACE, [] ],
    [ TrainerType.CYNTHIA, [] ],
    [ TrainerType.ALDER, [] ],
    [ TrainerType.IRIS, [] ],
    [ TrainerType.DIANTHA, [] ],
    [ TrainerType.HAU, [] ],
    [ TrainerType.GEETA, [] ],
    [ TrainerType.NEMONA, [] ],
    [ TrainerType.KIERAN, [] ],
    [ TrainerType.LEON, [] ],
    [ TrainerType.RIVAL, [] ]
  ];

  biomeDepths[Biome.TOWN] = [ 0, 1 ];

  const traverseBiome = (biome: Biome, depth: integer) => {
    const linkedBiomes: (Biome | [ Biome, integer ])[] = Array.isArray(biomeLinks[biome])
      ? biomeLinks[biome] as (Biome | [ Biome, integer ])[]
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
  biomeDepths[Biome.END] = [ Object.values(biomeDepths).map(d => d[0]).reduce((max: integer, value: integer) => Math.max(max, value), 0) + 1, 1 ];

  for (const biome of Utils.getEnumValues(Biome)) {
    biomePokemonPools[biome] = {};
    biomeTrainerPools[biome] = {};

    for (const tier of Utils.getEnumValues(BiomePoolTier)) {
      biomePokemonPools[biome][tier] = {};
      biomeTrainerPools[biome][tier] = [];

      for (const tod of Utils.getEnumValues(TimeOfDay)) {
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

    if (!biomeEntries.filter(b => b[0] !== Biome.END).length && !speciesEvolutions.filter(es => !!((pokemonBiomes.find(p => p[0] === es.speciesId))[3] as any[]).filter(b => b[0] !== Biome.END).length).length) {
      uncatchableSpecies.push(speciesId);
    }

    for (const b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];
      const timesOfDay = b.length > 2
        ? Array.isArray(b[2])
          ? b[2]
          : [ b[2] ]
        : [ TimeOfDay.ALL ];

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
            } else if (speciesEvolutions && speciesEvolutions.find(se => se.speciesId === existingSpeciesId)) {
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
      const tier = parseInt(t) as BiomePoolTier;
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
              const prevolution = entry.map(s => pokemonEvolutions[s]).flat().find(e => e && e.speciesId === speciesId);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function outputPools() {
    const pokemonOutput = {};
    const trainerOutput = {};

    for (const b of Object.keys(biomePokemonPools)) {
      const biome = Biome[b];
      pokemonOutput[biome] = {};
      trainerOutput[biome] = {};

      for (const t of Object.keys(biomePokemonPools[b])) {
        const tier = BiomePoolTier[t];

        pokemonOutput[biome][tier] = {};

        for (const tod of Object.keys(biomePokemonPools[b][t])) {
          const timeOfDay = TimeOfDay[tod];

          pokemonOutput[biome][tier][timeOfDay] = [];

          for (const f of biomePokemonPools[b][t][tod]) {
            if (typeof f === "number") {
              pokemonOutput[biome][tier][timeOfDay].push(Species[f]);
            } else {
              const tree = {};

              for (const l of Object.keys(f)) {
                tree[l] = f[l].map(s => Species[s]);
              }

              pokemonOutput[biome][tier][timeOfDay].push(tree);
            }
          }

        }
      }

      for (const t of Object.keys(biomeTrainerPools[b])) {
        const tier = BiomePoolTier[t];

        trainerOutput[biome][tier] = [];

        for (const f of biomeTrainerPools[b][t]) {
          trainerOutput[biome][tier].push(TrainerType[f]);
        }
      }
    }

    console.log(beautify(pokemonOutput, null, 2, 180).replace(/(        |        (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |(?:,|\[) (?:"\w+": \[ |(?:\{ )?"\d+": \[ )?)"(\w+)"(?= |,|\n)/g, "$1Species.$2").replace(/"(\d+)": /g, "$1: ").replace(/((?:      )|(?:(?!\n)    "(?:.*?)": \{) |\[(?: .*? )?\], )"(\w+)"/g, "$1[TimeOfDay.$2]").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[Biome.$2]"));
    console.log(beautify(trainerOutput, null, 2, 120).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, "$1TrainerType.$2").replace(/"(\d+)": /g, "$1: ").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[Biome.$2]"));
  }

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
