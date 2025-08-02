import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { BiomeId } from "#enums/biome-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import { randSeedInt } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import i18next from "i18next";

export function getBiomeName(biome: BiomeId | -1) {
  if (biome === -1) {
    return i18next.t("biome:unknownLocation");
  }
  switch (biome) {
    case BiomeId.GRASS:
      return i18next.t("biome:GRASS");
    case BiomeId.RUINS:
      return i18next.t("biome:RUINS");
    case BiomeId.END:
      return i18next.t("biome:END");
    default:
      return i18next.t(`biome:${BiomeId[biome].toUpperCase()}`);
  }
}

interface BiomeLinks {
  [key: number]: BiomeId | (BiomeId | [BiomeId, number])[]
}

interface BiomeDepths {
  [key: number]: [number, number]
}

export const biomeLinks: BiomeLinks = {
  [BiomeId.TOWN]: BiomeId.PLAINS,
  [BiomeId.PLAINS]: [ BiomeId.GRASS, BiomeId.METROPOLIS, BiomeId.LAKE ],
  [BiomeId.GRASS]: BiomeId.TALL_GRASS,
  [BiomeId.TALL_GRASS]: [ BiomeId.FOREST, BiomeId.CAVE ],
  [BiomeId.SLUM]: [ BiomeId.CONSTRUCTION_SITE, [ BiomeId.SWAMP, 2 ]],
  [BiomeId.FOREST]: [ BiomeId.JUNGLE, BiomeId.MEADOW ],
  [BiomeId.SEA]: [ BiomeId.SEABED, BiomeId.ICE_CAVE ],
  [BiomeId.SWAMP]: [ BiomeId.GRAVEYARD, BiomeId.TALL_GRASS ],
  [BiomeId.BEACH]: [ BiomeId.SEA, [ BiomeId.ISLAND, 2 ]],
  [BiomeId.LAKE]: [ BiomeId.BEACH, BiomeId.SWAMP, BiomeId.CONSTRUCTION_SITE ],
  [BiomeId.SEABED]: [ BiomeId.CAVE, [ BiomeId.VOLCANO, 3 ]],
  [BiomeId.MOUNTAIN]: [ BiomeId.VOLCANO, [ BiomeId.WASTELAND, 2 ], [ BiomeId.SPACE, 3 ]],
  [BiomeId.BADLANDS]: [ BiomeId.DESERT, BiomeId.MOUNTAIN ],
  [BiomeId.CAVE]: [ BiomeId.BADLANDS, BiomeId.LAKE, [ BiomeId.LABORATORY, 2 ]],
  [BiomeId.DESERT]: [ BiomeId.RUINS, [ BiomeId.CONSTRUCTION_SITE, 2 ]],
  [BiomeId.ICE_CAVE]: BiomeId.SNOWY_FOREST,
  [BiomeId.MEADOW]: [ BiomeId.PLAINS, BiomeId.FAIRY_CAVE ],
  [BiomeId.POWER_PLANT]: BiomeId.FACTORY,
  [BiomeId.VOLCANO]: [ BiomeId.BEACH, [ BiomeId.ICE_CAVE, 3 ]],
  [BiomeId.GRAVEYARD]: BiomeId.ABYSS,
  [BiomeId.DOJO]: [ BiomeId.PLAINS, [ BiomeId.JUNGLE, 2 ], [ BiomeId.TEMPLE, 2 ]],
  [BiomeId.FACTORY]: [ BiomeId.PLAINS, [ BiomeId.LABORATORY, 2 ]],
  [BiomeId.RUINS]: [ BiomeId.MOUNTAIN, [ BiomeId.FOREST, 2 ]],
  [BiomeId.WASTELAND]: BiomeId.BADLANDS,
  [BiomeId.ABYSS]: [ BiomeId.CAVE, [ BiomeId.SPACE, 2 ], [ BiomeId.WASTELAND, 2 ]],
  [BiomeId.SPACE]: BiomeId.RUINS,
  [BiomeId.CONSTRUCTION_SITE]: [ BiomeId.POWER_PLANT, [ BiomeId.DOJO, 2 ]],
  [BiomeId.JUNGLE]: [ BiomeId.TEMPLE ],
  [BiomeId.FAIRY_CAVE]: [ BiomeId.ICE_CAVE, [ BiomeId.SPACE, 2 ]],
  [BiomeId.TEMPLE]: [ BiomeId.DESERT, [ BiomeId.SWAMP, 2 ], [ BiomeId.RUINS, 2 ]],
  [BiomeId.METROPOLIS]: BiomeId.SLUM,
  [BiomeId.SNOWY_FOREST]: [ BiomeId.FOREST, [ BiomeId.MOUNTAIN, 2 ], [ BiomeId.LAKE, 2 ]],
  [BiomeId.ISLAND]: BiomeId.SEA,
  [BiomeId.LABORATORY]: BiomeId.CONSTRUCTION_SITE
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

interface SpeciesTree {
  [key: number]: SpeciesId[]
}

export interface PokemonPools {
  [key: number]: (SpeciesId | SpeciesTree)[]
}

interface BiomeTierPokemonPools {
  [key: number]: PokemonPools
}

interface BiomePokemonPools {
  [key: number]: BiomeTierPokemonPools
}

export interface BiomeTierTod {
  biome: BiomeId,
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
  [BiomeId.TOWN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.CATERPIE ], 7: [ SpeciesId.METAPOD ] },
        SpeciesId.SENTRET,
        SpeciesId.LEDYBA,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        { 1: [ SpeciesId.SCATTERBUG ], 9: [ SpeciesId.SPEWPA ] },
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.CATERPIE ], 7: [ SpeciesId.METAPOD ] },
        SpeciesId.SENTRET,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.SILCOON,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        { 1: [ SpeciesId.SCATTERBUG ], 9: [ SpeciesId.SPEWPA ] },
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.WEEDLE ], 7: [ SpeciesId.KAKUNA ] }, SpeciesId.POOCHYENA, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.WEEDLE ], 7: [ SpeciesId.KAKUNA ] }, SpeciesId.HOOTHOOT, SpeciesId.SPINARAK, SpeciesId.POOCHYENA, SpeciesId.CASCOON, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
      [TimeOfDay.ALL]: [ SpeciesId.PIDGEY, SpeciesId.RATTATA, SpeciesId.SPEAROW, SpeciesId.ZIGZAGOON, SpeciesId.WURMPLE, SpeciesId.TAILLOW, SpeciesId.BIDOOF, SpeciesId.LILLIPUP, SpeciesId.FLETCHLING, SpeciesId.WOOLOO, SpeciesId.LECHONK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.BELLSPROUT, SpeciesId.POOCHYENA, SpeciesId.LOTAD, SpeciesId.SKITTY, SpeciesId.COMBEE, SpeciesId.CHERUBI, SpeciesId.PATRAT, SpeciesId.MINCCINO, SpeciesId.PAWMI ],
      [TimeOfDay.DAY]: [ SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_M, SpeciesId.BELLSPROUT, SpeciesId.POOCHYENA, SpeciesId.LOTAD, SpeciesId.SKITTY, SpeciesId.COMBEE, SpeciesId.CHERUBI, SpeciesId.PATRAT, SpeciesId.MINCCINO, SpeciesId.PAWMI ],
      [TimeOfDay.DUSK]: [ SpeciesId.EKANS, SpeciesId.ODDISH, SpeciesId.MEOWTH, SpeciesId.SPINARAK, SpeciesId.SEEDOT, SpeciesId.SHROOMISH, SpeciesId.KRICKETOT, SpeciesId.VENIPEDE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.EKANS, SpeciesId.ODDISH, SpeciesId.PARAS, SpeciesId.VENONAT, SpeciesId.MEOWTH, SpeciesId.SEEDOT, SpeciesId.SHROOMISH, SpeciesId.KRICKETOT, SpeciesId.VENIPEDE ],
      [TimeOfDay.ALL]: [ SpeciesId.NINCADA, SpeciesId.WHISMUR, SpeciesId.FIDOUGH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.TANDEMAUS ], [TimeOfDay.DAY]: [ SpeciesId.TANDEMAUS ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ABRA, SpeciesId.SURSKIT, SpeciesId.ROOKIDEE ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.EEVEE, SpeciesId.RALTS ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.PLAINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.SENTRET ], 15: [ SpeciesId.FURRET ] }, { 1: [ SpeciesId.YUNGOOS ], 20: [ SpeciesId.GUMSHOOS ] }, { 1: [ SpeciesId.SKWOVET ], 24: [ SpeciesId.GREEDENT ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.SENTRET ], 15: [ SpeciesId.FURRET ] }, { 1: [ SpeciesId.YUNGOOS ], 20: [ SpeciesId.GUMSHOOS ] }, { 1: [ SpeciesId.SKWOVET ], 24: [ SpeciesId.GREEDENT ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.MEOWTH ], 28: [ SpeciesId.PERSIAN ] }, { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.ZUBAT ], 22: [ SpeciesId.GOLBAT ] }, { 1: [ SpeciesId.MEOWTH ], 28: [ SpeciesId.PERSIAN ] }, { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.ZIGZAGOON ], 20: [ SpeciesId.LINOONE ] }, { 1: [ SpeciesId.BIDOOF ], 15: [ SpeciesId.BIBAREL ] }, { 1: [ SpeciesId.LECHONK ], 18: [ SpeciesId.OINKOLOGNE ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.DODUO ], 31: [ SpeciesId.DODRIO ] },
        { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ] },
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ] },
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ] },
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.DODUO ], 31: [ SpeciesId.DODRIO ] },
        { 1: [ SpeciesId.POOCHYENA ], 18: [ SpeciesId.MIGHTYENA ] },
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ] },
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ] },
        { 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ] },
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PIDGEY ], 18: [ SpeciesId.PIDGEOTTO ], 36: [ SpeciesId.PIDGEOT ] },
        { 1: [ SpeciesId.SPEAROW ], 20: [ SpeciesId.FEAROW ] },
        SpeciesId.PIKACHU,
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.ABRA ], 16: [ SpeciesId.KADABRA ] }, { 1: [ SpeciesId.BUNEARY ], 20: [ SpeciesId.LOPUNNY ] }, { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FARFETCHD, SpeciesId.LICKITUNG, SpeciesId.CHANSEY, SpeciesId.EEVEE, SpeciesId.SNORLAX, { 1: [ SpeciesId.DUNSPARCE ], 62: [ SpeciesId.DUDUNSPARCE ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.LATIAS, SpeciesId.LATIOS ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LATIAS, SpeciesId.LATIOS ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.HOPPIP ], 18: [ SpeciesId.SKIPLOOM ] }, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.HOPPIP ], 18: [ SpeciesId.SKIPLOOM ] }, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ] }, { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ] }, { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ] } ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ] }, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ] }, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] } ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BULBASAUR ], 16: [ SpeciesId.IVYSAUR ], 32: [ SpeciesId.VENUSAUR ] }, SpeciesId.GROWLITHE, { 1: [ SpeciesId.TURTWIG ], 18: [ SpeciesId.GROTLE ], 32: [ SpeciesId.TORTERRA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUDOWOODO ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VIRIZION ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.JUMPLUFF, SpeciesId.SUNFLORA, SpeciesId.WHIMSICOTT ], [TimeOfDay.DAY]: [ SpeciesId.JUMPLUFF, SpeciesId.SUNFLORA, SpeciesId.WHIMSICOTT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VENUSAUR, SpeciesId.SUDOWOODO, SpeciesId.TORTERRA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VIRIZION ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.BOUNSWEET ], 18: [ SpeciesId.STEENEE ], 58: [ SpeciesId.TSAREENA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.NIDORAN_F ], 16: [ SpeciesId.NIDORINA ] }, { 1: [ SpeciesId.NIDORAN_M ], 16: [ SpeciesId.NIDORINO ] }, { 1: [ SpeciesId.BOUNSWEET ], 18: [ SpeciesId.STEENEE ], 58: [ SpeciesId.TSAREENA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.ODDISH ], 21: [ SpeciesId.GLOOM ] }, { 1: [ SpeciesId.KRICKETOT ], 10: [ SpeciesId.KRICKETUNE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.ODDISH ], 21: [ SpeciesId.GLOOM ] }, { 1: [ SpeciesId.KRICKETOT ], 10: [ SpeciesId.KRICKETUNE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.NINCADA ], 20: [ SpeciesId.NINJASK ] }, { 1: [ SpeciesId.FOMANTIS ], 34: [ SpeciesId.LURANTIS ] }, { 1: [ SpeciesId.NYMBLE ], 24: [ SpeciesId.LOKIX ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.PARAS ], 24: [ SpeciesId.PARASECT ] }, { 1: [ SpeciesId.VENONAT ], 31: [ SpeciesId.VENOMOTH ] }, { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ] } ],
      [TimeOfDay.ALL]: [ SpeciesId.VULPIX ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.PINSIR, { 1: [ SpeciesId.CHIKORITA ], 16: [ SpeciesId.BAYLEEF ], 32: [ SpeciesId.MEGANIUM ] }, { 1: [ SpeciesId.GIRAFARIG ], 62: [ SpeciesId.FARIGIRAF ] }, SpeciesId.ZANGOOSE, SpeciesId.KECLEON, SpeciesId.TROPIUS ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SCYTHER, SpeciesId.SHEDINJA, SpeciesId.ROTOM ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.TSAREENA ],
      [TimeOfDay.DAY]: [ SpeciesId.NIDOQUEEN, SpeciesId.NIDOKING, SpeciesId.TSAREENA ],
      [TimeOfDay.DUSK]: [ SpeciesId.VILEPLUME, SpeciesId.KRICKETUNE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.VILEPLUME, SpeciesId.KRICKETUNE ],
      [TimeOfDay.ALL]: [ SpeciesId.NINJASK, SpeciesId.ZANGOOSE, SpeciesId.KECLEON, SpeciesId.LURANTIS, SpeciesId.LOKIX ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.BELLOSSOM ], [TimeOfDay.DAY]: [ SpeciesId.BELLOSSOM ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PINSIR, SpeciesId.MEGANIUM, SpeciesId.FARIGIRAF ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.METROPOLIS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.YAMPER ], 25: [ SpeciesId.BOLTUND ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.YAMPER ], 25: [ SpeciesId.BOLTUND ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.HOUNDOUR ], 24: [ SpeciesId.HOUNDOOM ] }, { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.RATTATA ], 20: [ SpeciesId.RATICATE ] }, { 1: [ SpeciesId.ZIGZAGOON ], 20: [ SpeciesId.LINOONE ] }, { 1: [ SpeciesId.LILLIPUP ], 16: [ SpeciesId.HERDIER ], 32: [ SpeciesId.STOUTLAND ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] }, SpeciesId.INDEEDEE ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] }, SpeciesId.INDEEDEE ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.ESPURR ], 25: [ SpeciesId.MEOWSTIC ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.ESPURR ], 25: [ SpeciesId.MEOWSTIC ] } ],
      [TimeOfDay.ALL]: [ SpeciesId.PIKACHU, { 1: [ SpeciesId.GLAMEOW ], 38: [ SpeciesId.PURUGLY ] }, SpeciesId.FURFROU, { 1: [ SpeciesId.FIDOUGH ], 26: [ SpeciesId.DACHSBUN ] }, SpeciesId.SQUAWKABILLY ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.TANDEMAUS ], 25: [ SpeciesId.MAUSHOLD ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.TANDEMAUS ], 25: [ SpeciesId.MAUSHOLD ] } ],
      [TimeOfDay.DUSK]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.VAROOM ], 40: [ SpeciesId.REVAVROOM ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.EEVEE, SpeciesId.SMEARGLE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CASTFORM ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.BOLTUND ], [TimeOfDay.DAY]: [ SpeciesId.BOLTUND ], [TimeOfDay.DUSK]: [ SpeciesId.MEOWSTIC ], [TimeOfDay.NIGHT]: [ SpeciesId.MEOWSTIC ], [TimeOfDay.ALL]: [ SpeciesId.STOUTLAND, SpeciesId.FURFROU, SpeciesId.DACHSBUN ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.MAUSHOLD ], [TimeOfDay.DAY]: [ SpeciesId.MAUSHOLD ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CASTFORM, SpeciesId.REVAVROOM ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.BUTTERFREE,
        { 1: [ SpeciesId.BELLSPROUT ], 21: [ SpeciesId.WEEPINBELL ] },
        { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ] },
        SpeciesId.PETILIL,
        { 1: [ SpeciesId.DEERLING ], 34: [ SpeciesId.SAWSBUCK ] },
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.BUTTERFREE,
        { 1: [ SpeciesId.BELLSPROUT ], 21: [ SpeciesId.WEEPINBELL ] },
        SpeciesId.BEAUTIFLY,
        { 1: [ SpeciesId.COMBEE ], 21: [ SpeciesId.VESPIQUEN ] },
        SpeciesId.PETILIL,
        { 1: [ SpeciesId.DEERLING ], 34: [ SpeciesId.SAWSBUCK ] },
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DUSK]: [
        SpeciesId.BEEDRILL,
        { 1: [ SpeciesId.PINECO ], 31: [ SpeciesId.FORRETRESS ] },
        { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ] },
        { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ] },
        { 1: [ SpeciesId.VENIPEDE ], 22: [ SpeciesId.WHIRLIPEDE ], 30: [ SpeciesId.SCOLIPEDE ] }
      ],
      [TimeOfDay.NIGHT]: [
        SpeciesId.BEEDRILL,
        { 1: [ SpeciesId.VENONAT ], 31: [ SpeciesId.VENOMOTH ] },
        { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ] },
        { 1: [ SpeciesId.PINECO ], 31: [ SpeciesId.FORRETRESS ] },
        SpeciesId.DUSTOX,
        { 1: [ SpeciesId.SEEDOT ], 14: [ SpeciesId.NUZLEAF ] },
        { 1: [ SpeciesId.SHROOMISH ], 23: [ SpeciesId.BRELOOM ] },
        { 1: [ SpeciesId.VENIPEDE ], 22: [ SpeciesId.WHIRLIPEDE ], 30: [ SpeciesId.SCOLIPEDE ] }
      ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.TAROUNTULA ], 15: [ SpeciesId.SPIDOPS ] }, { 1: [ SpeciesId.NYMBLE ], 24: [ SpeciesId.LOKIX ] }, { 1: [ SpeciesId.SHROODLE ], 28: [ SpeciesId.GRAFAIAI ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ] } ],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ] }, { 1: [ SpeciesId.DOTTLER ], 30: [ SpeciesId.ORBEETLE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.HOOTHOOT ], 20: [ SpeciesId.NOCTOWL ] }, { 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ] }, { 1: [ SpeciesId.DOTTLER ], 30: [ SpeciesId.ORBEETLE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ] },
        { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] },
        { 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ] },
        { 1: [ SpeciesId.PANSAGE ], 30: [ SpeciesId.SIMISAGE ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.ALL]: [
        SpeciesId.HERACROSS,
        { 1: [ SpeciesId.TREECKO ], 16: [ SpeciesId.GROVYLE ], 36: [ SpeciesId.SCEPTILE ] },
        SpeciesId.TROPIUS,
        SpeciesId.KARRABLAST,
        SpeciesId.SHELMET,
        { 1: [ SpeciesId.CHESPIN ], 16: [ SpeciesId.QUILLADIN ], 36: [ SpeciesId.CHESNAUGHT ] },
        { 1: [ SpeciesId.ROWLET ], 17: [ SpeciesId.DARTRIX ], 34: [ SpeciesId.DECIDUEYE ] },
        SpeciesId.SQUAWKABILLY,
        { 1: [ SpeciesId.TOEDSCOOL ], 30: [ SpeciesId.TOEDSCRUEL ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.BLOODMOON_URSALUNA ], [TimeOfDay.ALL]: [ SpeciesId.DURANT ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KARTANA, SpeciesId.WO_CHIEN ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KARTANA, SpeciesId.WO_CHIEN ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CALYREX ] }
  },
  [BiomeId.SEA]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ] }, { 1: [ SpeciesId.WINGULL ], 25: [ SpeciesId.PELIPPER ] }, SpeciesId.CRAMORANT, { 1: [ SpeciesId.FINIZEN ], 38: [ SpeciesId.PALAFIN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ] }, { 1: [ SpeciesId.WINGULL ], 25: [ SpeciesId.PELIPPER ] }, SpeciesId.CRAMORANT, { 1: [ SpeciesId.FINIZEN ], 38: [ SpeciesId.PALAFIN ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.INKAY ], 30: [ SpeciesId.MALAMAR ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.FINNEON ], 31: [ SpeciesId.LUMINEON ] }, { 1: [ SpeciesId.INKAY ], 30: [ SpeciesId.MALAMAR ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.TENTACOOL ], 30: [ SpeciesId.TENTACRUEL ] }, { 1: [ SpeciesId.MAGIKARP ], 20: [ SpeciesId.GYARADOS ] }, { 1: [ SpeciesId.BUIZEL ], 26: [ SpeciesId.FLOATZEL ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ] }, SpeciesId.SHELLDER, { 1: [ SpeciesId.CARVANHA ], 30: [ SpeciesId.SHARPEDO ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ] }, SpeciesId.SHELLDER, { 1: [ SpeciesId.CHINCHOU ], 27: [ SpeciesId.LANTURN ] }, { 1: [ SpeciesId.CARVANHA ], 30: [ SpeciesId.SHARPEDO ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.POLIWAG ], 25: [ SpeciesId.POLIWHIRL ] },
        { 1: [ SpeciesId.HORSEA ], 32: [ SpeciesId.SEADRA ] },
        { 1: [ SpeciesId.GOLDEEN ], 33: [ SpeciesId.SEAKING ] },
        { 1: [ SpeciesId.WAILMER ], 40: [ SpeciesId.WAILORD ] },
        { 1: [ SpeciesId.PANPOUR ], 30: [ SpeciesId.SIMIPOUR ] },
        { 1: [ SpeciesId.WATTREL ], 25: [ SpeciesId.KILOWATTREL ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.LAPRAS, { 1: [ SpeciesId.PIPLUP ], 16: [ SpeciesId.PRINPLUP ], 36: [ SpeciesId.EMPOLEON ] }, { 1: [ SpeciesId.POPPLIO ], 17: [ SpeciesId.BRIONNE ], 34: [ SpeciesId.PRIMARINA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KINGDRA, SpeciesId.ROTOM, { 1: [ SpeciesId.TIRTOUGA ], 37: [ SpeciesId.CARRACOSTA ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PELIPPER, SpeciesId.CRAMORANT, SpeciesId.PALAFIN ],
      [TimeOfDay.DAY]: [ SpeciesId.PELIPPER, SpeciesId.CRAMORANT, SpeciesId.PALAFIN ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHARPEDO, SpeciesId.MALAMAR ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHARPEDO, SpeciesId.LUMINEON, SpeciesId.MALAMAR ],
      [TimeOfDay.ALL]: [ SpeciesId.TENTACRUEL, SpeciesId.FLOATZEL, SpeciesId.SIMIPOUR, SpeciesId.KILOWATTREL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KINGDRA, SpeciesId.EMPOLEON, SpeciesId.PRIMARINA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LUGIA ] }
  },
  [BiomeId.SWAMP]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ] }, { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ] }, { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ] }, { 1: [ SpeciesId.PALDEA_WOOPER ], 20: [ SpeciesId.CLODSIRE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ] }, { 1: [ SpeciesId.PALDEA_WOOPER ], 20: [ SpeciesId.CLODSIRE ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.POLIWAG ], 25: [ SpeciesId.POLIWHIRL ] },
        { 1: [ SpeciesId.GULPIN ], 26: [ SpeciesId.SWALOT ] },
        { 1: [ SpeciesId.SHELLOS ], 30: [ SpeciesId.GASTRODON ] },
        { 1: [ SpeciesId.TYMPOLE ], 25: [ SpeciesId.PALPITOAD ], 36: [ SpeciesId.SEISMITOAD ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.EKANS ], 22: [ SpeciesId.ARBOK ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PSYDUCK ], 33: [ SpeciesId.GOLDUCK ] },
        { 1: [ SpeciesId.BARBOACH ], 30: [ SpeciesId.WHISCASH ] },
        { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ] },
        SpeciesId.STUNFISK,
        { 1: [ SpeciesId.MAREANIE ], 38: [ SpeciesId.TOXAPEX ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.TOTODILE ], 18: [ SpeciesId.CROCONAW ], 30: [ SpeciesId.FERALIGATR ] }, { 1: [ SpeciesId.MUDKIP ], 16: [ SpeciesId.MARSHTOMP ], 36: [ SpeciesId.SWAMPERT ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.GALAR_SLOWPOKE ], 40: [ SpeciesId.GALAR_SLOWBRO ] }, { 1: [ SpeciesId.HISUI_SLIGGOO ], 80: [ SpeciesId.HISUI_GOODRA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.GALAR_SLOWPOKE ], 40: [ SpeciesId.GALAR_SLOWBRO ] }, { 1: [ SpeciesId.HISUI_SLIGGOO ], 80: [ SpeciesId.HISUI_GOODRA ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.POLITOED, SpeciesId.GALAR_STUNFISK ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, { 1: [ SpeciesId.POIPOLE ], 60: [ SpeciesId.NAGANADEL ] } ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, { 1: [ SpeciesId.POIPOLE ], 60: [ SpeciesId.NAGANADEL ] } ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.BEACH]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.STARYU ], 30: [ SpeciesId.STARMIE ] } ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.KRABBY ], 28: [ SpeciesId.KINGLER ] },
        { 1: [ SpeciesId.CORPHISH ], 30: [ SpeciesId.CRAWDAUNT ] },
        { 1: [ SpeciesId.DWEBBLE ], 34: [ SpeciesId.CRUSTLE ] },
        { 1: [ SpeciesId.BINACLE ], 39: [ SpeciesId.BARBARACLE ] },
        { 1: [ SpeciesId.MAREANIE ], 38: [ SpeciesId.TOXAPEX ] },
        { 1: [ SpeciesId.WIGLETT ], 26: [ SpeciesId.WUGTRIO ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ] }, { 1: [ SpeciesId.CLAUNCHER ], 37: [ SpeciesId.CLAWITZER ] }, { 1: [ SpeciesId.SANDYGAST ], 42: [ SpeciesId.PALOSSAND ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.QUAXLY ], 16: [ SpeciesId.QUAXWELL ], 36: [ SpeciesId.QUAQUAVAL ] }, SpeciesId.TATSUGIRI ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.TIRTOUGA ], 37: [ SpeciesId.CARRACOSTA ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRESSELIA, SpeciesId.KELDEO, SpeciesId.TAPU_FINI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.STARMIE ],
      [TimeOfDay.DAY]: [ SpeciesId.STARMIE ],
      [TimeOfDay.DUSK]: [ SpeciesId.CLOYSTER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CLOYSTER ],
      [TimeOfDay.ALL]: [ SpeciesId.KINGLER, SpeciesId.CRAWDAUNT, SpeciesId.WORMADAM, SpeciesId.CRUSTLE, SpeciesId.BARBARACLE, SpeciesId.CLAWITZER, SpeciesId.TOXAPEX, SpeciesId.PALOSSAND ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CARRACOSTA, SpeciesId.QUAQUAVAL ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRESSELIA, SpeciesId.KELDEO, SpeciesId.TAPU_FINI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.LAKE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ] }, { 1: [ SpeciesId.DUCKLETT ], 35: [ SpeciesId.SWANNA ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.LOTAD ], 14: [ SpeciesId.LOMBRE ] }, { 1: [ SpeciesId.DUCKLETT ], 35: [ SpeciesId.SWANNA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PSYDUCK ], 33: [ SpeciesId.GOLDUCK ] },
        { 1: [ SpeciesId.GOLDEEN ], 33: [ SpeciesId.SEAKING ] },
        { 1: [ SpeciesId.MAGIKARP ], 20: [ SpeciesId.GYARADOS ] },
        { 1: [ SpeciesId.CHEWTLE ], 22: [ SpeciesId.DREDNAW ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.DEWPIDER ], 22: [ SpeciesId.ARAQUANID ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.DEWPIDER ], 22: [ SpeciesId.ARAQUANID ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.SLOWPOKE ], 37: [ SpeciesId.SLOWBRO ] }, { 1: [ SpeciesId.WOOPER ], 20: [ SpeciesId.QUAGSIRE ] }, { 1: [ SpeciesId.SURSKIT ], 22: [ SpeciesId.MASQUERAIN ] }, SpeciesId.WISHIWASHI, SpeciesId.FLAMIGO ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SQUIRTLE ], 16: [ SpeciesId.WARTORTLE ], 36: [ SpeciesId.BLASTOISE ] },
        { 1: [ SpeciesId.OSHAWOTT ], 17: [ SpeciesId.DEWOTT ], 36: [ SpeciesId.SAMUROTT ] },
        { 1: [ SpeciesId.FROAKIE ], 16: [ SpeciesId.FROGADIER ], 36: [ SpeciesId.GRENINJA ] },
        { 1: [ SpeciesId.SOBBLE ], 16: [ SpeciesId.DRIZZILE ], 35: [ SpeciesId.INTELEON ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.VAPOREON, SpeciesId.SLOWKING ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUICUNE, SpeciesId.MESPRIT ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SWANNA, SpeciesId.ARAQUANID ],
      [TimeOfDay.DAY]: [ SpeciesId.SWANNA, SpeciesId.ARAQUANID ],
      [TimeOfDay.DUSK]: [ SpeciesId.AZUMARILL ],
      [TimeOfDay.NIGHT]: [ SpeciesId.AZUMARILL ],
      [TimeOfDay.ALL]: [ SpeciesId.GOLDUCK, SpeciesId.SLOWBRO, SpeciesId.SEAKING, SpeciesId.GYARADOS, SpeciesId.MASQUERAIN, SpeciesId.WISHIWASHI, SpeciesId.DREDNAW ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLASTOISE, SpeciesId.VAPOREON, SpeciesId.SLOWKING, SpeciesId.SAMUROTT, SpeciesId.GRENINJA, SpeciesId.INTELEON ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SUICUNE, SpeciesId.MESPRIT ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.SEABED]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CHINCHOU ], 27: [ SpeciesId.LANTURN ] },
        SpeciesId.REMORAID,
        SpeciesId.CLAMPERL,
        SpeciesId.BASCULIN,
        { 1: [ SpeciesId.FRILLISH ], 40: [ SpeciesId.JELLICENT ] },
        { 1: [ SpeciesId.ARROKUDA ], 26: [ SpeciesId.BARRASKEWDA ] },
        SpeciesId.VELUZA
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.TENTACOOL ], 30: [ SpeciesId.TENTACRUEL ] },
        SpeciesId.SHELLDER,
        { 1: [ SpeciesId.WAILMER ], 40: [ SpeciesId.WAILORD ] },
        SpeciesId.LUVDISC,
        { 1: [ SpeciesId.SHELLOS ], 30: [ SpeciesId.GASTRODON ] },
        { 1: [ SpeciesId.SKRELP ], 48: [ SpeciesId.DRAGALGE ] },
        SpeciesId.PINCURCHIN,
        SpeciesId.DONDOZO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.QWILFISH, SpeciesId.CORSOLA, SpeciesId.OCTILLERY, { 1: [ SpeciesId.MANTYKE ], 52: [ SpeciesId.MANTINE ] }, SpeciesId.ALOMOMOLA, { 1: [ SpeciesId.TYNAMO ], 39: [ SpeciesId.EELEKTRIK ] }, SpeciesId.DHELMISE ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.OMANYTE ], 40: [ SpeciesId.OMASTAR ] },
        { 1: [ SpeciesId.KABUTO ], 40: [ SpeciesId.KABUTOPS ] },
        SpeciesId.RELICANTH,
        SpeciesId.PYUKUMUKU,
        { 1: [ SpeciesId.GALAR_CORSOLA ], 38: [ SpeciesId.CURSOLA ] },
        SpeciesId.ARCTOVISH,
        SpeciesId.HISUI_QWILFISH
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FEEBAS, SpeciesId.NIHILEGO ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MILOTIC, SpeciesId.NIHILEGO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KYOGRE ] }
  },
  [BiomeId.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.TAILLOW ], 22: [ SpeciesId.SWELLOW ] },
        { 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ] },
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ] },
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ] },
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.TAILLOW ], 22: [ SpeciesId.SWELLOW ] },
        { 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ] },
        { 1: [ SpeciesId.STARLY ], 14: [ SpeciesId.STARAVIA ], 34: [ SpeciesId.STARAPTOR ] },
        { 1: [ SpeciesId.PIDOVE ], 21: [ SpeciesId.TRANQUILL ], 32: [ SpeciesId.UNFEZANT ] },
        { 1: [ SpeciesId.FLETCHLING ], 17: [ SpeciesId.FLETCHINDER ], 35: [ SpeciesId.TALONFLAME ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] }, { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ] }, { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] }, { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ] }, { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.PIDGEY ], 18: [ SpeciesId.PIDGEOTTO ], 36: [ SpeciesId.PIDGEOT ] }, { 1: [ SpeciesId.SPEAROW ], 20: [ SpeciesId.FEAROW ] }, { 1: [ SpeciesId.SKIDDO ], 32: [ SpeciesId.GOGOAT ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] },
        { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ] },
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] },
        { 1: [ SpeciesId.RUFFLET ], 54: [ SpeciesId.BRAVIARY ] },
        { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ] },
        { 1: [ SpeciesId.FLITTLE ], 35: [ SpeciesId.ESPATHRA ] },
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] },
        { 1: [ SpeciesId.ARON ], 32: [ SpeciesId.LAIRON ], 42: [ SpeciesId.AGGRON ] },
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] },
        { 1: [ SpeciesId.RUFFLET ], 54: [ SpeciesId.BRAVIARY ] },
        { 1: [ SpeciesId.ROOKIDEE ], 18: [ SpeciesId.CORVISQUIRE ], 38: [ SpeciesId.CORVIKNIGHT ] },
        { 1: [ SpeciesId.FLITTLE ], 35: [ SpeciesId.ESPATHRA ] },
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.VULLABY ], 54: [ SpeciesId.MANDIBUZZ ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.VULLABY ], 54: [ SpeciesId.MANDIBUZZ ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ] },
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ] },
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ] },
        { 1: [ SpeciesId.SLUGMA ], 38: [ SpeciesId.MAGCARGO ] },
        { 1: [ SpeciesId.NACLI ], 24: [ SpeciesId.NACLSTACK ], 38: [ SpeciesId.GARGANACL ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.MURKROW ],
      [TimeOfDay.ALL]: [ SpeciesId.SKARMORY, { 1: [ SpeciesId.TORCHIC ], 16: [ SpeciesId.COMBUSKEN ], 36: [ SpeciesId.BLAZIKEN ] }, { 1: [ SpeciesId.SPOINK ], 32: [ SpeciesId.GRUMPIG ] }, SpeciesId.HAWLUCHA, SpeciesId.KLAWF ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ] },
        { 1: [ SpeciesId.CRANIDOS ], 30: [ SpeciesId.RAMPARDOS ] },
        { 1: [ SpeciesId.SHIELDON ], 30: [ SpeciesId.BASTIODON ] },
        { 1: [ SpeciesId.GIBLE ], 24: [ SpeciesId.GABITE ], 48: [ SpeciesId.GARCHOMP ] },
        SpeciesId.ROTOM,
        SpeciesId.ARCHEOPS,
        { 1: [ SpeciesId.AXEW ], 38: [ SpeciesId.FRAXURE ] }
      ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SWELLOW, SpeciesId.ALTARIA, SpeciesId.STARAPTOR, SpeciesId.UNFEZANT, SpeciesId.BRAVIARY, SpeciesId.TALONFLAME, SpeciesId.CORVIKNIGHT, SpeciesId.ESPATHRA ],
      [TimeOfDay.DAY]: [ SpeciesId.SWELLOW, SpeciesId.ALTARIA, SpeciesId.STARAPTOR, SpeciesId.UNFEZANT, SpeciesId.BRAVIARY, SpeciesId.TALONFLAME, SpeciesId.CORVIKNIGHT, SpeciesId.ESPATHRA ],
      [TimeOfDay.DUSK]: [ SpeciesId.MANDIBUZZ ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MANDIBUZZ ],
      [TimeOfDay.ALL]: [ SpeciesId.PIDGEOT, SpeciesId.FEAROW, SpeciesId.SKARMORY, SpeciesId.AGGRON, SpeciesId.GOGOAT, SpeciesId.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.HISUI_BRAVIARY ], [TimeOfDay.DAY]: [ SpeciesId.HISUI_BRAVIARY ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLAZIKEN, SpeciesId.RAMPARDOS, SpeciesId.BASTIODON, SpeciesId.HAWLUCHA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM, SpeciesId.TORNADUS, SpeciesId.TING_LU, SpeciesId.OGERPON ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HO_OH ] }
  },
  [BiomeId.BADLANDS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.PHANPY ], 25: [ SpeciesId.DONPHAN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.PHANPY ], 25: [ SpeciesId.DONPHAN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.DIGLETT ], 26: [ SpeciesId.DUGTRIO ] },
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ] },
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] },
        { 1: [ SpeciesId.DRILBUR ], 31: [ SpeciesId.EXCADRILL ] },
        { 1: [ SpeciesId.MUDBRAY ], 30: [ SpeciesId.MUDSDALE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.SIZZLIPEDE ], 28: [ SpeciesId.CENTISKORCH ] }, { 1: [ SpeciesId.CAPSAKID ], 30: [ SpeciesId.SCOVILLAIN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.SIZZLIPEDE ], 28: [ SpeciesId.CENTISKORCH ] }, { 1: [ SpeciesId.CAPSAKID ], 30: [ SpeciesId.SCOVILLAIN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SANDSHREW ], 22: [ SpeciesId.SANDSLASH ] },
        { 1: [ SpeciesId.NUMEL ], 33: [ SpeciesId.CAMERUPT ] },
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] },
        { 1: [ SpeciesId.CUFANT ], 34: [ SpeciesId.COPPERAJAH ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.GLIGAR, { 1: [ SpeciesId.POLTCHAGEIST ], 30: [ SpeciesId.SINISTCHA ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LANDORUS, SpeciesId.OKIDOGI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN ],
      [TimeOfDay.DAY]: [ SpeciesId.DONPHAN, SpeciesId.CENTISKORCH, SpeciesId.SCOVILLAIN ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.DUGTRIO, SpeciesId.GOLEM, SpeciesId.RHYPERIOR, SpeciesId.GLISCOR, SpeciesId.EXCADRILL, SpeciesId.MUDSDALE, SpeciesId.COPPERAJAH ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.STEELIX, SpeciesId.SINISTCHA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LANDORUS, SpeciesId.OKIDOGI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GROUDON ] }
  },
  [BiomeId.CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.ZUBAT ], 22: [ SpeciesId.GOLBAT ] },
        { 1: [ SpeciesId.PARAS ], 24: [ SpeciesId.PARASECT ] },
        { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] },
        { 1: [ SpeciesId.WHISMUR ], 20: [ SpeciesId.LOUDRED ], 40: [ SpeciesId.EXPLOUD ] },
        { 1: [ SpeciesId.ROGGENROLA ], 25: [ SpeciesId.BOLDORE ] },
        { 1: [ SpeciesId.WOOBAT ], 20: [ SpeciesId.SWOOBAT ] },
        { 1: [ SpeciesId.BUNNELBY ], 20: [ SpeciesId.DIGGERSBY ] },
        { 1: [ SpeciesId.NACLI ], 24: [ SpeciesId.NACLSTACK ], 38: [ SpeciesId.GARGANACL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.ROCKRUFF ], 25: [ SpeciesId.LYCANROC ] } ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GEODUDE ], 25: [ SpeciesId.GRAVELER ] },
        { 1: [ SpeciesId.MAKUHITA ], 24: [ SpeciesId.HARIYAMA ] },
        SpeciesId.NOSEPASS,
        { 1: [ SpeciesId.NOIBAT ], 48: [ SpeciesId.NOIVERN ] },
        { 1: [ SpeciesId.WIMPOD ], 30: [ SpeciesId.GOLISOPOD ] }
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ONIX, { 1: [ SpeciesId.FERROSEED ], 40: [ SpeciesId.FERROTHORN ] }, SpeciesId.CARBINK, { 1: [ SpeciesId.GLIMMET ], 35: [ SpeciesId.GLIMMORA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHUCKLE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UXIE ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.PARASECT, SpeciesId.ONIX, SpeciesId.CROBAT, SpeciesId.URSARING, SpeciesId.EXPLOUD, SpeciesId.PROBOPASS, SpeciesId.GIGALITH, SpeciesId.SWOOBAT, SpeciesId.DIGGERSBY, SpeciesId.NOIVERN, SpeciesId.GOLISOPOD, SpeciesId.GARGANACL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.LYCANROC ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHUCKLE, SpeciesId.FERROTHORN, SpeciesId.GLIMMORA ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UXIE ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERAPAGOS ] }
  },
  [BiomeId.DESERT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.TRAPINCH, { 1: [ SpeciesId.HIPPOPOTAS ], 34: [ SpeciesId.HIPPOWDON ] }, { 1: [ SpeciesId.RELLOR ], 29: [ SpeciesId.RABSCA ] } ],
      [TimeOfDay.DAY]: [ SpeciesId.TRAPINCH, { 1: [ SpeciesId.HIPPOPOTAS ], 34: [ SpeciesId.HIPPOWDON ] }, { 1: [ SpeciesId.RELLOR ], 29: [ SpeciesId.RABSCA ] } ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.CACNEA ], 32: [ SpeciesId.CACTURNE ] }, { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.CACNEA ], 32: [ SpeciesId.CACTURNE ] }, { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.SANDSHREW ], 22: [ SpeciesId.SANDSLASH ] }, { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ] }, { 1: [ SpeciesId.SILICOBRA ], 36: [ SpeciesId.SANDACONDA ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ] }, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.SANDILE ], 29: [ SpeciesId.KROKOROK ], 40: [ SpeciesId.KROOKODILE ] }, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.MARACTUS, { 1: [ SpeciesId.BRAMBLIN ], 30: [ SpeciesId.BRAMBLEGHAST ] }, SpeciesId.ORTHWORM ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.DARUMAKA ], 35: [ SpeciesId.DARMANITAN ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.LILEEP ], 40: [ SpeciesId.CRADILY ] }, { 1: [ SpeciesId.ANORITH ], 40: [ SpeciesId.ARMALDO ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIROCK, SpeciesId.TAPU_BULU, SpeciesId.PHEROMOSA ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.HIPPOWDON, SpeciesId.HELIOLISK, SpeciesId.RABSCA ],
      [TimeOfDay.DAY]: [ SpeciesId.HIPPOWDON, SpeciesId.HELIOLISK, SpeciesId.RABSCA ],
      [TimeOfDay.DUSK]: [ SpeciesId.CACTURNE, SpeciesId.KROOKODILE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CACTURNE, SpeciesId.KROOKODILE ],
      [TimeOfDay.ALL]: [ SpeciesId.SANDSLASH, SpeciesId.DRAPION, SpeciesId.DARMANITAN, SpeciesId.MARACTUS, SpeciesId.SANDACONDA, SpeciesId.BRAMBLEGHAST ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CRADILY, SpeciesId.ARMALDO ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIROCK, SpeciesId.TAPU_BULU, SpeciesId.PHEROMOSA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.SEEL ], 34: [ SpeciesId.DEWGONG ] },
        { 1: [ SpeciesId.SWINUB ], 33: [ SpeciesId.PILOSWINE ] },
        { 1: [ SpeciesId.SNOVER ], 40: [ SpeciesId.ABOMASNOW ] },
        { 1: [ SpeciesId.VANILLITE ], 35: [ SpeciesId.VANILLISH ], 47: [ SpeciesId.VANILLUXE ] },
        { 1: [ SpeciesId.CUBCHOO ], 37: [ SpeciesId.BEARTIC ] },
        { 1: [ SpeciesId.BERGMITE ], 37: [ SpeciesId.AVALUGG ] },
        SpeciesId.CRABRAWLER,
        { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.SNEASEL,
        { 1: [ SpeciesId.SNORUNT ], 42: [ SpeciesId.GLALIE ] },
        { 1: [ SpeciesId.SPHEAL ], 32: [ SpeciesId.SEALEO ], 44: [ SpeciesId.WALREIN ] },
        SpeciesId.EISCUE,
        { 1: [ SpeciesId.CETODDLE ], 30: [ SpeciesId.CETITAN ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.FROSLASS, SpeciesId.CRYOGONAL ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, SpeciesId.ROTOM, { 1: [ SpeciesId.AMAURA ], 39: [ SpeciesId.AURORUS ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARTICUNO, SpeciesId.REGICE ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DEWGONG, SpeciesId.GLALIE, SpeciesId.WALREIN, SpeciesId.WEAVILE, SpeciesId.MAMOSWINE, SpeciesId.FROSLASS, SpeciesId.VANILLUXE, SpeciesId.BEARTIC, SpeciesId.CRYOGONAL, SpeciesId.AVALUGG, SpeciesId.CRABOMINABLE, SpeciesId.CETITAN ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.GLACEON, SpeciesId.AURORUS ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARTICUNO, SpeciesId.REGICE, SpeciesId.ROTOM ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KYUREM ] }
  },
  [BiomeId.MEADOW]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.LEDYBA ], 18: [ SpeciesId.LEDIAN ] }, SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.BLITZLE ], 27: [ SpeciesId.ZEBSTRIKA ] },
        { 1: [ SpeciesId.FLABEBE ], 19: [ SpeciesId.FLOETTE ] },
        { 1: [ SpeciesId.CUTIEFLY ], 25: [ SpeciesId.RIBOMBEE ] },
        { 1: [ SpeciesId.GOSSIFLEUR ], 20: [ SpeciesId.ELDEGOSS ] },
        { 1: [ SpeciesId.WOOLOO ], 24: [ SpeciesId.DUBWOOL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ] },
        { 1: [ SpeciesId.SNUBBULL ], 23: [ SpeciesId.GRANBULL ] },
        { 1: [ SpeciesId.SKITTY ], 30: [ SpeciesId.DELCATTY ] },
        SpeciesId.BOUFFALANT,
        { 1: [ SpeciesId.SMOLIV ], 25: [ SpeciesId.DOLLIV ], 35: [ SpeciesId.ARBOLIVA ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ] },
        { 1: [ SpeciesId.SNUBBULL ], 23: [ SpeciesId.GRANBULL ] },
        { 1: [ SpeciesId.SKITTY ], 30: [ SpeciesId.DELCATTY ] },
        SpeciesId.BOUFFALANT,
        { 1: [ SpeciesId.SMOLIV ], 25: [ SpeciesId.DOLLIV ], 35: [ SpeciesId.ARBOLIVA ] }
      ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.JIGGLYPUFF ], 30: [ SpeciesId.WIGGLYTUFF ] },
        { 1: [ SpeciesId.MAREEP ], 15: [ SpeciesId.FLAAFFY ], 30: [ SpeciesId.AMPHAROS ] },
        { 1: [ SpeciesId.RALTS ], 20: [ SpeciesId.KIRLIA ], 30: [ SpeciesId.GARDEVOIR ] },
        { 1: [ SpeciesId.GLAMEOW ], 38: [ SpeciesId.PURUGLY ] },
        SpeciesId.ORICORIO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.VOLBEAT, SpeciesId.ILLUMISE ],
      [TimeOfDay.ALL]: [ SpeciesId.TAUROS, SpeciesId.EEVEE, SpeciesId.MILTANK, SpeciesId.SPINDA, { 1: [ SpeciesId.APPLIN ], 30: [ SpeciesId.DIPPLIN ] }, { 1: [ SpeciesId.SPRIGATITO ], 16: [ SpeciesId.FLORAGATO ], 36: [ SpeciesId.MEOWSCARADA ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CHANSEY, SpeciesId.SYLVEON ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MELOETTA ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.LEDIAN, SpeciesId.GRANBULL, SpeciesId.DELCATTY, SpeciesId.ROSERADE, SpeciesId.CINCCINO, SpeciesId.BOUFFALANT, SpeciesId.ARBOLIVA ],
      [TimeOfDay.DAY]: [ SpeciesId.GRANBULL, SpeciesId.DELCATTY, SpeciesId.ROSERADE, SpeciesId.CINCCINO, SpeciesId.BOUFFALANT, SpeciesId.ARBOLIVA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.TAUROS, SpeciesId.MILTANK, SpeciesId.GARDEVOIR, SpeciesId.PURUGLY, SpeciesId.ZEBSTRIKA, SpeciesId.FLORGES, SpeciesId.RIBOMBEE, SpeciesId.DUBWOOL ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [ SpeciesId.HISUI_LILLIGANT ], [TimeOfDay.DAY]: [ SpeciesId.HISUI_LILLIGANT ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLISSEY, SpeciesId.SYLVEON, SpeciesId.FLAPPLE, SpeciesId.APPLETUN, SpeciesId.MEOWSCARADA, SpeciesId.HYDRAPPLE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MELOETTA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SHAYMIN ] }
  },
  [BiomeId.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.PIKACHU,
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ] },
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ] },
        { 1: [ SpeciesId.ELECTRIKE ], 26: [ SpeciesId.MANECTRIC ] },
        { 1: [ SpeciesId.SHINX ], 15: [ SpeciesId.LUXIO ], 30: [ SpeciesId.LUXRAY ] },
        SpeciesId.DEDENNE,
        { 1: [ SpeciesId.GRUBBIN ], 20: [ SpeciesId.CHARJABUG ] },
        { 1: [ SpeciesId.PAWMI ], 18: [ SpeciesId.PAWMO ], 32: [ SpeciesId.PAWMOT ] },
        { 1: [ SpeciesId.TADBULB ], 30: [ SpeciesId.BELLIBOLT ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ELECTABUZZ, SpeciesId.PLUSLE, SpeciesId.MINUN, SpeciesId.PACHIRISU, SpeciesId.EMOLGA, SpeciesId.TOGEDEMARU ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.MAREEP ], 15: [ SpeciesId.FLAAFFY ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JOLTEON, SpeciesId.HISUI_VOLTORB ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.RAIKOU, SpeciesId.THUNDURUS, SpeciesId.XURKITREE, SpeciesId.ZERAORA, SpeciesId.REGIELEKI ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.RAICHU, SpeciesId.MANECTRIC, SpeciesId.LUXRAY, SpeciesId.MAGNEZONE, SpeciesId.ELECTIVIRE, SpeciesId.DEDENNE, SpeciesId.VIKAVOLT, SpeciesId.TOGEDEMARU, SpeciesId.PAWMOT, SpeciesId.BELLIBOLT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JOLTEON, SpeciesId.AMPHAROS, SpeciesId.HISUI_ELECTRODE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZAPDOS, SpeciesId.RAIKOU, SpeciesId.THUNDURUS, SpeciesId.XURKITREE, SpeciesId.ZERAORA, SpeciesId.REGIELEKI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZEKROM ] }
  },
  [BiomeId.VOLCANO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.VULPIX,
        SpeciesId.GROWLITHE,
        { 1: [ SpeciesId.PONYTA ], 40: [ SpeciesId.RAPIDASH ] },
        { 1: [ SpeciesId.SLUGMA ], 38: [ SpeciesId.MAGCARGO ] },
        { 1: [ SpeciesId.NUMEL ], 33: [ SpeciesId.CAMERUPT ] },
        { 1: [ SpeciesId.SALANDIT ], 33: [ SpeciesId.SALAZZLE ] },
        { 1: [ SpeciesId.ROLYCOLY ], 18: [ SpeciesId.CARKOL ], 34: [ SpeciesId.COALOSSAL ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MAGMAR, SpeciesId.TORKOAL, { 1: [ SpeciesId.PANSEAR ], 30: [ SpeciesId.SIMISEAR ] }, SpeciesId.HEATMOR, SpeciesId.TURTONATOR ] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CHARMANDER ], 16: [ SpeciesId.CHARMELEON ], 36: [ SpeciesId.CHARIZARD ] },
        { 1: [ SpeciesId.CYNDAQUIL ], 14: [ SpeciesId.QUILAVA ], 36: [ SpeciesId.TYPHLOSION ] },
        { 1: [ SpeciesId.CHIMCHAR ], 14: [ SpeciesId.MONFERNO ], 36: [ SpeciesId.INFERNAPE ] },
        { 1: [ SpeciesId.TEPIG ], 17: [ SpeciesId.PIGNITE ], 36: [ SpeciesId.EMBOAR ] },
        { 1: [ SpeciesId.FENNEKIN ], 16: [ SpeciesId.BRAIXEN ], 36: [ SpeciesId.DELPHOX ] },
        { 1: [ SpeciesId.LITTEN ], 17: [ SpeciesId.TORRACAT ], 34: [ SpeciesId.INCINEROAR ] },
        { 1: [ SpeciesId.SCORBUNNY ], 16: [ SpeciesId.RABOOT ], 35: [ SpeciesId.CINDERACE ] },
        { 1: [ SpeciesId.CHARCADET ], 30: [ SpeciesId.ARMAROUGE ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FLAREON, SpeciesId.ROTOM, { 1: [ SpeciesId.LARVESTA ], 59: [ SpeciesId.VOLCARONA ] }, SpeciesId.HISUI_GROWLITHE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ENTEI, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MOLTRES, SpeciesId.ENTEI, SpeciesId.ROTOM, SpeciesId.HEATRAN, SpeciesId.VOLCANION, SpeciesId.CHI_YU ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.RESHIRAM ] }
  },
  [BiomeId.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GASTLY ], 25: [ SpeciesId.HAUNTER ] },
        { 1: [ SpeciesId.SHUPPET ], 37: [ SpeciesId.BANETTE ] },
        { 1: [ SpeciesId.DUSKULL ], 37: [ SpeciesId.DUSCLOPS ] },
        { 1: [ SpeciesId.DRIFLOON ], 28: [ SpeciesId.DRIFBLIM ] },
        { 1: [ SpeciesId.LITWICK ], 41: [ SpeciesId.LAMPENT ] },
        SpeciesId.PHANTUMP,
        SpeciesId.PUMPKABOO,
        { 1: [ SpeciesId.GREAVARD ], 30: [ SpeciesId.HOUNDSTONE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ] }, { 1: [ SpeciesId.YAMASK ], 34: [ SpeciesId.COFAGRIGUS ] }, { 1: [ SpeciesId.SINISTEA ], 30: [ SpeciesId.POLTEAGEIST ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MISDREAVUS, SpeciesId.MIMIKYU, { 1: [ SpeciesId.FUECOCO ], 16: [ SpeciesId.CROCALOR ], 36: [ SpeciesId.SKELEDIRGE ] }, SpeciesId.CERULEDGE ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SPIRITOMB ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MARSHADOW, SpeciesId.SPECTRIER ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.DAY]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.DUSK]: [ SpeciesId.MAROWAK ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.GENGAR, SpeciesId.BANETTE, SpeciesId.DRIFBLIM, SpeciesId.MISMAGIUS, SpeciesId.DUSKNOIR, SpeciesId.CHANDELURE, SpeciesId.TREVENANT, SpeciesId.GOURGEIST, SpeciesId.MIMIKYU, SpeciesId.POLTEAGEIST, SpeciesId.HOUNDSTONE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SKELEDIRGE, SpeciesId.CERULEDGE, SpeciesId.HISUI_TYPHLOSION ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MARSHADOW, SpeciesId.SPECTRIER ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GIRATINA ] }
  },
  [BiomeId.DOJO]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MANKEY ], 28: [ SpeciesId.PRIMEAPE ], 75: [ SpeciesId.ANNIHILAPE ] },
        { 1: [ SpeciesId.MAKUHITA ], 24: [ SpeciesId.HARIYAMA ] },
        { 1: [ SpeciesId.MEDITITE ], 37: [ SpeciesId.MEDICHAM ] },
        { 1: [ SpeciesId.STUFFUL ], 27: [ SpeciesId.BEWEAR ] },
        { 1: [ SpeciesId.CLOBBOPUS ], 35: [ SpeciesId.GRAPPLOCT ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.CROAGUNK ], 37: [ SpeciesId.TOXICROAK ] }, { 1: [ SpeciesId.SCRAGGY ], 39: [ SpeciesId.SCRAFTY ] }, { 1: [ SpeciesId.MIENFOO ], 50: [ SpeciesId.MIENSHAO ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.LUCARIO, SpeciesId.THROH, SpeciesId.SAWK, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.GALAR_FARFETCHD ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, { 1: [ SpeciesId.KUBFU ], 60: [ SpeciesId.URSHIFU] }, SpeciesId.GALAR_ZAPDOS ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.HARIYAMA, SpeciesId.MEDICHAM, SpeciesId.LUCARIO, SpeciesId.TOXICROAK, SpeciesId.THROH, SpeciesId.SAWK, SpeciesId.SCRAFTY, SpeciesId.MIENSHAO, SpeciesId.BEWEAR, SpeciesId.GRAPPLOCT, SpeciesId.ANNIHILAPE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.PANGORO, SpeciesId.SIRFETCHD, SpeciesId.HISUI_DECIDUEYE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, { 1: [ SpeciesId.KUBFU ], 60: [ SpeciesId.URSHIFU] } ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZAMAZENTA, SpeciesId.GALAR_ZAPDOS ] }
  },
  [BiomeId.FACTORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ] },
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ] },
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ] },
        { 1: [ SpeciesId.TIMBURR ], 25: [ SpeciesId.GURDURR ] },
        { 1: [ SpeciesId.KLINK ], 38: [ SpeciesId.KLANG ], 49: [ SpeciesId.KLINKLANG ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ] }, SpeciesId.KLEFKI ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BELDUM ], 20: [ SpeciesId.METANG ], 45: [ SpeciesId.METAGROSS ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GENESECT, SpeciesId.MAGEARNA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KLINKLANG, SpeciesId.KLEFKI ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GENESECT, SpeciesId.MAGEARNA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.RUINS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.DROWZEE ], 26: [ SpeciesId.HYPNO ] },
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ] },
        SpeciesId.UNOWN,
        { 1: [ SpeciesId.SPOINK ], 32: [ SpeciesId.GRUMPIG ] },
        { 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ] },
        { 1: [ SpeciesId.ELGYEM ], 42: [ SpeciesId.BEHEEYEM ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.ABRA ], 16: [ SpeciesId.KADABRA ] }, SpeciesId.SIGILYPH, { 1: [ SpeciesId.TINKATINK ], 24: [ SpeciesId.TINKATUFF ], 38: [ SpeciesId.TINKATON ] } ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, { 1: [ SpeciesId.GOTHITA ], 32: [ SpeciesId.GOTHORITA ], 41: [ SpeciesId.GOTHITELLE ] }, SpeciesId.STONJOURNER ] },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ SpeciesId.ESPEON ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.GALAR_YAMASK ], 34: [ SpeciesId.RUNERIGUS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.GALAR_YAMASK ], 34: [ SpeciesId.RUNERIGUS ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.ARCHEN ], 37: [ SpeciesId.ARCHEOPS ] } ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ALAKAZAM, SpeciesId.HYPNO, SpeciesId.XATU, SpeciesId.GRUMPIG, SpeciesId.CLAYDOL, SpeciesId.SIGILYPH, SpeciesId.GOTHITELLE, SpeciesId.BEHEEYEM, SpeciesId.TINKATON ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.ESPEON ], [TimeOfDay.DUSK]: [ SpeciesId.RUNERIGUS ], [TimeOfDay.NIGHT]: [ SpeciesId.RUNERIGUS ], [TimeOfDay.ALL]: [ SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, SpeciesId.ARCHEOPS ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGISTEEL, SpeciesId.FEZANDIPITI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KORAIDON ] }
  },
  [BiomeId.WASTELAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        { 1: [ SpeciesId.BAGON ], 30: [ SpeciesId.SHELGON ], 50: [ SpeciesId.SALAMENCE ] },
        { 1: [ SpeciesId.GOOMY ], 40: [ SpeciesId.SLIGGOO ], 80: [ SpeciesId.GOODRA ] },
        { 1: [ SpeciesId.JANGMO_O ], 35: [ SpeciesId.HAKAMO_O ], 45: [ SpeciesId.KOMMO_O ] }
      ],
      [TimeOfDay.DAY]: [
        { 1: [ SpeciesId.BAGON ], 30: [ SpeciesId.SHELGON ], 50: [ SpeciesId.SALAMENCE ] },
        { 1: [ SpeciesId.GOOMY ], 40: [ SpeciesId.SLIGGOO ], 80: [ SpeciesId.GOODRA ] },
        { 1: [ SpeciesId.JANGMO_O ], 35: [ SpeciesId.HAKAMO_O ], 45: [ SpeciesId.KOMMO_O ] }
      ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ], 55: [ SpeciesId.TYRANITAR ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.LARVITAR ], 30: [ SpeciesId.PUPITAR ], 55: [ SpeciesId.TYRANITAR ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.VIBRAVA ], 45: [ SpeciesId.FLYGON ] },
        { 1: [ SpeciesId.GIBLE ], 24: [ SpeciesId.GABITE ], 48: [ SpeciesId.GARCHOMP ] },
        { 1: [ SpeciesId.AXEW ], 38: [ SpeciesId.FRAXURE ], 48: [ SpeciesId.HAXORUS ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.SWABLU ], 35: [ SpeciesId.ALTARIA ] }, SpeciesId.DRAMPA, SpeciesId.CYCLIZAR ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.DREEPY ], 50: [ SpeciesId.DRAKLOAK ], 60: [ SpeciesId.DRAGAPULT ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.DREEPY ], 50: [ SpeciesId.DRAKLOAK ], 60: [ SpeciesId.DRAGAPULT ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.DRATINI ], 30: [ SpeciesId.DRAGONAIR ], 55: [ SpeciesId.DRAGONITE ] }, { 1: [ SpeciesId.FRIGIBAX ], 35: [ SpeciesId.ARCTIBAX ], 54: [ SpeciesId.BAXCALIBUR ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AERODACTYL, SpeciesId.DRUDDIGON, { 1: [ SpeciesId.TYRUNT ], 39: [ SpeciesId.TYRANTRUM ] }, SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIDRAGO ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O ],
      [TimeOfDay.DAY]: [ SpeciesId.SALAMENCE, SpeciesId.GOODRA, SpeciesId.KOMMO_O ],
      [TimeOfDay.DUSK]: [ SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TYRANITAR, SpeciesId.DRAGAPULT ],
      [TimeOfDay.ALL]: [ SpeciesId.DRAGONITE, SpeciesId.FLYGON, SpeciesId.GARCHOMP, SpeciesId.HAXORUS, SpeciesId.DRAMPA, SpeciesId.BAXCALIBUR ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AERODACTYL, SpeciesId.DRUDDIGON, SpeciesId.TYRANTRUM, SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIDRAGO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIALGA ] }
  },
  [BiomeId.ABYSS]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.MURKROW,
        { 1: [ SpeciesId.HOUNDOUR ], 24: [ SpeciesId.HOUNDOOM ] },
        SpeciesId.SABLEYE,
        { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ] },
        { 1: [ SpeciesId.PAWNIARD ], 52: [ SpeciesId.BISHARP ], 64: [ SpeciesId.KINGAMBIT ] },
        { 1: [ SpeciesId.NICKIT ], 18: [ SpeciesId.THIEVUL ] },
        { 1: [ SpeciesId.IMPIDIMP ], 32: [ SpeciesId.MORGREM ], 42: [ SpeciesId.GRIMMSNARL ] },
        { 1: [ SpeciesId.MASCHIFF ], 30: [ SpeciesId.MABOSSTIFF ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ABSOL, SpeciesId.SPIRITOMB, { 1: [ SpeciesId.ZORUA ], 30: [ SpeciesId.ZOROARK ] }, { 1: [ SpeciesId.DEINO ], 50: [ SpeciesId.ZWEILOUS ], 64: [ SpeciesId.HYDREIGON ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UMBREON ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DARKRAI, SpeciesId.GALAR_MOLTRES ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.HOUNDOOM, SpeciesId.SABLEYE, SpeciesId.ABSOL, SpeciesId.HONCHKROW, SpeciesId.SPIRITOMB, SpeciesId.LIEPARD, SpeciesId.ZOROARK, SpeciesId.HYDREIGON, SpeciesId.THIEVUL, SpeciesId.GRIMMSNARL, SpeciesId.MABOSSTIFF, SpeciesId.KINGAMBIT ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.UMBREON, SpeciesId.HISUI_SAMUROTT ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DARKRAI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PALKIA, SpeciesId.YVELTAL, SpeciesId.GALAR_MOLTRES ] }
  },
  [BiomeId.SPACE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ SpeciesId.SOLROCK ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.LUNATONE ],
      [TimeOfDay.ALL]: [ SpeciesId.CLEFAIRY, { 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ] }, { 1: [ SpeciesId.MUNNA ], 30: [ SpeciesId.MUSHARNA ] }, SpeciesId.MINIOR ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ] }, { 1: [ SpeciesId.ELGYEM ], 42: [ SpeciesId.BEHEEYEM ] } ] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BELDUM ], 20: [ SpeciesId.METANG ], 45: [ SpeciesId.METAGROSS ] }, SpeciesId.SIGILYPH, { 1: [ SpeciesId.SOLOSIS ], 32: [ SpeciesId.DUOSION ], 41: [ SpeciesId.REUNICLUS ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ] } ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.COSMOG ], 23: [ SpeciesId.COSMOEM ] }, SpeciesId.CELESTEELA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.SOLROCK ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.LUNATONE ], [TimeOfDay.ALL]: [ SpeciesId.CLEFABLE, SpeciesId.BRONZONG, SpeciesId.MUSHARNA, SpeciesId.REUNICLUS, SpeciesId.MINIOR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.METAGROSS, SpeciesId.PORYGON_Z ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CELESTEELA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [ SpeciesId.SOLGALEO ], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [ SpeciesId.LUNALA ], [TimeOfDay.ALL]: [ SpeciesId.RAYQUAZA, SpeciesId.NECROZMA ] }
  },
  [BiomeId.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MACHOP ], 28: [ SpeciesId.MACHOKE ] },
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ] },
        { 1: [ SpeciesId.DRILBUR ], 31: [ SpeciesId.EXCADRILL ] },
        { 1: [ SpeciesId.TIMBURR ], 25: [ SpeciesId.GURDURR ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ] },
        { 1: [ SpeciesId.KOFFING ], 35: [ SpeciesId.WEEZING ] },
        { 1: [ SpeciesId.RHYHORN ], 42: [ SpeciesId.RHYDON ] },
        { 1: [ SpeciesId.SCRAGGY ], 39: [ SpeciesId.SCRAFTY ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.GALAR_MEOWTH ], 28: [ SpeciesId.PERRSERKER ] } ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.DURALUDON ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.HITMONTOP ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MACHAMP, SpeciesId.CONKELDURR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.PERRSERKER ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARCHALUDON ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.JUNGLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.VESPIQUEN, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ] }, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ] } ],
      [TimeOfDay.DAY]: [ SpeciesId.VESPIQUEN, { 1: [ SpeciesId.CHERUBI ], 25: [ SpeciesId.CHERRIM ] }, { 1: [ SpeciesId.SEWADDLE ], 20: [ SpeciesId.SWADLOON ], 30: [ SpeciesId.LEAVANNY ] } ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHROOMISH, { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ] }, { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ] }, SpeciesId.SHROOMISH, { 1: [ SpeciesId.PURRLOIN ], 20: [ SpeciesId.LIEPARD ] }, { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] } ],
      [TimeOfDay.ALL]: [ SpeciesId.AIPOM, { 1: [ SpeciesId.BLITZLE ], 27: [ SpeciesId.ZEBSTRIKA ] }, { 1: [ SpeciesId.PIKIPEK ], 14: [ SpeciesId.TRUMBEAK ], 28: [ SpeciesId.TOUCANNON ] } ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DUSK]: [ SpeciesId.TANGELA, { 1: [ SpeciesId.SPINARAK ], 22: [ SpeciesId.ARIADOS ] }, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ] } ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TANGELA, { 1: [ SpeciesId.PANCHAM ], 52: [ SpeciesId.PANGORO ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.PANSAGE ], 30: [ SpeciesId.SIMISAGE ] },
        { 1: [ SpeciesId.PANSEAR ], 30: [ SpeciesId.SIMISEAR ] },
        { 1: [ SpeciesId.PANPOUR ], 30: [ SpeciesId.SIMIPOUR ] },
        { 1: [ SpeciesId.JOLTIK ], 36: [ SpeciesId.GALVANTULA ] },
        { 1: [ SpeciesId.LITLEO ], 35: [ SpeciesId.PYROAR ] },
        { 1: [ SpeciesId.FOMANTIS ], 34: [ SpeciesId.LURANTIS ] },
        SpeciesId.FALINKS
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] }, SpeciesId.PASSIMIAN, { 1: [ SpeciesId.GALAR_PONYTA ], 40: [ SpeciesId.GALAR_RAPIDASH ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.FOONGUS ], 39: [ SpeciesId.AMOONGUSS ] }, SpeciesId.PASSIMIAN ],
      [TimeOfDay.DUSK]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.ALL]: [
        SpeciesId.SCYTHER,
        SpeciesId.YANMA,
        { 1: [ SpeciesId.SLAKOTH ], 18: [ SpeciesId.VIGOROTH ], 36: [ SpeciesId.SLAKING ] },
        SpeciesId.SEVIPER,
        SpeciesId.CARNIVINE,
        { 1: [ SpeciesId.SNIVY ], 17: [ SpeciesId.SERVINE ], 36: [ SpeciesId.SERPERIOR ] },
        { 1: [ SpeciesId.GROOKEY ], 16: [ SpeciesId.THWACKEY ], 35: [ SpeciesId.RILLABOOM ] }
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KANGASKHAN, SpeciesId.CHATOT, SpeciesId.KLEAVOR ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TAPU_LELE, SpeciesId.BUZZWOLE, SpeciesId.ZARUDE, SpeciesId.MUNKIDORI ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TAPU_LELE, SpeciesId.BUZZWOLE, SpeciesId.ZARUDE, SpeciesId.MUNKIDORI ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KLEAVOR ] }
  },
  [BiomeId.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.JIGGLYPUFF ], 30: [ SpeciesId.WIGGLYTUFF ] },
        { 1: [ SpeciesId.MARILL ], 18: [ SpeciesId.AZUMARILL ] },
        SpeciesId.MAWILE,
        { 1: [ SpeciesId.SPRITZEE ], 40: [ SpeciesId.AROMATISSE ] },
        { 1: [ SpeciesId.SWIRLIX ], 40: [ SpeciesId.SLURPUFF ] },
        { 1: [ SpeciesId.CUTIEFLY ], 25: [ SpeciesId.RIBOMBEE ] },
        { 1: [ SpeciesId.MORELULL ], 24: [ SpeciesId.SHIINOTIC ] },
        { 1: [ SpeciesId.MILCERY ], 30: [ SpeciesId.ALCREMIE ] }
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
        { 1: [ SpeciesId.RALTS ], 20: [ SpeciesId.KIRLIA ], 30: [ SpeciesId.GARDEVOIR ] },
        SpeciesId.CARBINK,
        SpeciesId.COMFEY,
        { 1: [ SpeciesId.HATENNA ], 32: [ SpeciesId.HATTREM ], 42: [ SpeciesId.HATTERENE ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AUDINO ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ETERNAL_FLOETTE ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIANCIE, SpeciesId.ENAMORUS ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.WIGGLYTUFF, SpeciesId.MAWILE, SpeciesId.TOGEKISS, SpeciesId.AUDINO, SpeciesId.AROMATISSE, SpeciesId.SLURPUFF, SpeciesId.CARBINK, SpeciesId.RIBOMBEE, SpeciesId.SHIINOTIC, SpeciesId.COMFEY, SpeciesId.HATTERENE, SpeciesId.ALCREMIE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ETERNAL_FLOETTE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DIANCIE, SpeciesId.ENAMORUS ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.XERNEAS ] }
  },
  [BiomeId.TEMPLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.GASTLY ], 25: [ SpeciesId.HAUNTER ] },
        { 1: [ SpeciesId.NATU ], 25: [ SpeciesId.XATU ] },
        { 1: [ SpeciesId.DUSKULL ], 37: [ SpeciesId.DUSCLOPS ] },
        { 1: [ SpeciesId.YAMASK ], 34: [ SpeciesId.COFAGRIGUS ] },
        { 1: [ SpeciesId.GOLETT ], 43: [ SpeciesId.GOLURK ] },
        { 1: [ SpeciesId.HONEDGE ], 35: [ SpeciesId.DOUBLADE ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.CUBONE ], 28: [ SpeciesId.MAROWAK ] },
        { 1: [ SpeciesId.BALTOY ], 36: [ SpeciesId.CLAYDOL ] },
        { 1: [ SpeciesId.CHINGLING ], 20: [ SpeciesId.CHIMECHO ] },
        { 1: [ SpeciesId.SKORUPI ], 40: [ SpeciesId.DRAPION ] },
        { 1: [ SpeciesId.LITWICK ], 41: [ SpeciesId.LAMPENT ] }
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.GIMMIGHOUL ], 40: [ SpeciesId.GHOLDENGO ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HOOPA, SpeciesId.TAPU_KOKO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.CHIMECHO, SpeciesId.COFAGRIGUS, SpeciesId.GOLURK, SpeciesId.AEGISLASH ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GHOLDENGO ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HOOPA, SpeciesId.TAPU_KOKO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.REGIGIGAS ] }
  },
  [BiomeId.SLUM]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.PATRAT ], 20: [ SpeciesId.WATCHOG ] } ],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.RATTATA ], 20: [ SpeciesId.RATICATE ] },
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ] },
        { 1: [ SpeciesId.KOFFING ], 35: [ SpeciesId.WEEZING ] },
        { 1: [ SpeciesId.TRUBBISH ], 36: [ SpeciesId.GARBODOR ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.STUNKY ], 34: [ SpeciesId.SKUNTANK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.STUNKY ], 34: [ SpeciesId.SKUNTANK ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.BURMY ], 20: [ SpeciesId.WORMADAM ] } ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.TOXTRICITY, { 1: [ SpeciesId.GALAR_LINOONE ], 35: [ SpeciesId.OBSTAGOON ] }, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TOXTRICITY, { 1: [ SpeciesId.GALAR_LINOONE ], 35: [ SpeciesId.OBSTAGOON ] }, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.VAROOM ], 40: [ SpeciesId.REVAVROOM ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GUZZLORD ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.SKUNTANK, SpeciesId.WATCHOG ], [TimeOfDay.NIGHT]: [ SpeciesId.SKUNTANK, SpeciesId.WATCHOG ], [TimeOfDay.ALL]: [ SpeciesId.MUK, SpeciesId.WEEZING, SpeciesId.WORMADAM, SpeciesId.GARBODOR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.TOXTRICITY, SpeciesId.OBSTAGOON ], [TimeOfDay.NIGHT]: [ SpeciesId.TOXTRICITY, SpeciesId.OBSTAGOON ], [TimeOfDay.ALL]: [ SpeciesId.REVAVROOM, SpeciesId.GALAR_WEEZING ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GUZZLORD ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] }, { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ] } ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] }, { 1: [ SpeciesId.SNOM ], 20: [ SpeciesId.FROSMOTH ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.SWINUB ], 33: [ SpeciesId.PILOSWINE ] }, { 1: [ SpeciesId.SNOVER ], 40: [ SpeciesId.ABOMASNOW ] }, SpeciesId.EISCUE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] }, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.SNEASEL, { 1: [ SpeciesId.TEDDIURSA ], 30: [ SpeciesId.URSARING ] }, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ { 1: [ SpeciesId.GALAR_DARUMAKA ], 30: [ SpeciesId.GALAR_DARMANITAN ] } ],
      [TimeOfDay.DAY]: [ { 1: [ SpeciesId.GALAR_DARUMAKA ], 30: [ SpeciesId.GALAR_DARMANITAN ] } ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, { 1: [ SpeciesId.ALOLA_SANDSHREW ], 30: [ SpeciesId.ALOLA_SANDSLASH ] }, { 1: [ SpeciesId.ALOLA_VULPIX ], 30: [ SpeciesId.ALOLA_NINETALES ] } ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DAY]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.HISUI_ZORUA ], 30: [ SpeciesId.HISUI_ZOROARK ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.HISUI_ZORUA ], 30: [ SpeciesId.HISUI_ZOROARK ] } ],
      [TimeOfDay.ALL]: [ { 1: [ SpeciesId.GALAR_MR_MIME ], 42: [ SpeciesId.MR_RIME ] }, SpeciesId.ARCTOZOLT, SpeciesId.HISUI_AVALUGG ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GLASTRIER, SpeciesId.CHIEN_PAO, SpeciesId.GALAR_ARTICUNO ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [ SpeciesId.WYRDEER ], [TimeOfDay.DAY]: [ SpeciesId.WYRDEER ], [TimeOfDay.DUSK]: [ SpeciesId.FROSMOTH ], [TimeOfDay.NIGHT]: [ SpeciesId.FROSMOTH ], [TimeOfDay.ALL]: [ SpeciesId.ABOMASNOW, SpeciesId.URSALUNA ] },
    [BiomePoolTier.BOSS_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SNEASLER, SpeciesId.GALAR_DARMANITAN ],
      [TimeOfDay.DAY]: [ SpeciesId.SNEASLER, SpeciesId.GALAR_DARMANITAN ],
      [TimeOfDay.DUSK]: [ SpeciesId.HISUI_ZOROARK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.HISUI_ZOROARK ],
      [TimeOfDay.ALL]: [ SpeciesId.MR_RIME, SpeciesId.ARCTOZOLT, SpeciesId.ALOLA_SANDSLASH, SpeciesId.ALOLA_NINETALES ]
    },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.GLASTRIER, SpeciesId.CHIEN_PAO ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZACIAN, SpeciesId.GALAR_ARTICUNO ] }
  },
  [BiomeId.ISLAND]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ { 1: [ SpeciesId.ALOLA_RATTATA ], 20: [ SpeciesId.ALOLA_RATICATE ] }, { 1: [ SpeciesId.ALOLA_MEOWTH ], 30: [ SpeciesId.ALOLA_PERSIAN ] } ],
      [TimeOfDay.NIGHT]: [ { 1: [ SpeciesId.ALOLA_RATTATA ], 20: [ SpeciesId.ALOLA_RATICATE ] }, { 1: [ SpeciesId.ALOLA_MEOWTH ], 30: [ SpeciesId.ALOLA_PERSIAN ] } ],
      [TimeOfDay.ALL]: [
        SpeciesId.ORICORIO,
        { 1: [ SpeciesId.ALOLA_SANDSHREW ], 30: [ SpeciesId.ALOLA_SANDSLASH ] },
        { 1: [ SpeciesId.ALOLA_VULPIX ], 30: [ SpeciesId.ALOLA_NINETALES ] },
        { 1: [ SpeciesId.ALOLA_DIGLETT ], 26: [ SpeciesId.ALOLA_DUGTRIO ] },
        { 1: [ SpeciesId.ALOLA_GEODUDE ], 25: [ SpeciesId.ALOLA_GRAVELER ], 40: [ SpeciesId.ALOLA_GOLEM ] },
        { 1: [ SpeciesId.ALOLA_GRIMER ], 38: [ SpeciesId.ALOLA_MUK ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.BRUXISH ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLACEPHALON ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DAY]: [ SpeciesId.ALOLA_RAICHU, SpeciesId.ALOLA_EXEGGUTOR ],
      [TimeOfDay.DUSK]: [ SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ALOLA_RATICATE, SpeciesId.ALOLA_PERSIAN, SpeciesId.ALOLA_MAROWAK ],
      [TimeOfDay.ALL]: [ SpeciesId.ORICORIO, SpeciesId.BRUXISH, SpeciesId.ALOLA_SANDSLASH, SpeciesId.ALOLA_NINETALES, SpeciesId.ALOLA_DUGTRIO, SpeciesId.ALOLA_GOLEM, SpeciesId.ALOLA_MUK ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BLACEPHALON ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.LABORATORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        { 1: [ SpeciesId.MAGNEMITE ], 30: [ SpeciesId.MAGNETON ] },
        { 1: [ SpeciesId.GRIMER ], 38: [ SpeciesId.MUK ] },
        { 1: [ SpeciesId.VOLTORB ], 30: [ SpeciesId.ELECTRODE ] },
        { 1: [ SpeciesId.BRONZOR ], 33: [ SpeciesId.BRONZONG ] },
        { 1: [ SpeciesId.KLINK ], 38: [ SpeciesId.KLANG ], 49: [ SpeciesId.KLINKLANG ] }
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [ SpeciesId.SOLOSIS ], 32: [ SpeciesId.DUOSION ], 41: [ SpeciesId.REUNICLUS ] } ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, { 1: [ SpeciesId.PORYGON ], 30: [ SpeciesId.PORYGON2 ] } ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ { 1: [SpeciesId.TYPE_NULL], 60: [ SpeciesId.SILVALLY ] } ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MUK, SpeciesId.ELECTRODE, SpeciesId.BRONZONG, SpeciesId.MAGNEZONE, SpeciesId.PORYGON_Z, SpeciesId.REUNICLUS, SpeciesId.KLINKLANG ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM, SpeciesId.ZYGARDE, { 1: [SpeciesId.TYPE_NULL], 60: [ SpeciesId.SILVALLY ] } ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MEWTWO, SpeciesId.MIRAIDON ] }
  },
  [BiomeId.END]: {
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
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROARING_MOON, SpeciesId.IRON_VALIANT ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.WALKING_WAKE, SpeciesId.IRON_LEAVES, SpeciesId.GOUGING_FIRE, SpeciesId.RAGING_BOLT, SpeciesId.IRON_BOULDER, SpeciesId.IRON_CROWN ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ETERNATUS ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  }
};

export const biomeTrainerPools: BiomeTrainerPools = {
  [BiomeId.TOWN]: {
    [BiomePoolTier.COMMON]: [ TrainerType.YOUNGSTER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: []
  },
  [BiomeId.PLAINS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.TWINS ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.CYCLIST ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CILAN, TrainerType.CHILI, TrainerType.CRESS, TrainerType.CHEREN ]
  },
  [BiomeId.GRASS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.SCHOOL_KID ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.POKEFAN ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.ERIKA ]
  },
  [BiomeId.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER, TrainerType.RANGER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GARDENIA, TrainerType.VIOLA, TrainerType.BRASSIUS ]
  },
  [BiomeId.METROPOLIS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY, TrainerType.CLERK, TrainerType.CYCLIST, TrainerType.OFFICER, TrainerType.WAITER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BREEDER, TrainerType.DEPOT_AGENT, TrainerType.GUITARIST ],
    [BiomePoolTier.RARE]: [ TrainerType.ARTIST, TrainerType.RICH_KID ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.WHITNEY, TrainerType.NORMAN, TrainerType.IONO, TrainerType.LARRY ]
  },
  [BiomeId.FOREST]: {
    [BiomePoolTier.COMMON]: [ TrainerType.RANGER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BUGSY, TrainerType.BURGH, TrainerType.KATY ]
  },
  [BiomeId.SEA]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SAILOR, TrainerType.SWIMMER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MARLON ]
  },
  [BiomeId.SWAMP]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JANINE, TrainerType.ROXIE ]
  },
  [BiomeId.BEACH]: {
    [BiomePoolTier.COMMON]: [ TrainerType.FISHERMAN, TrainerType.SAILOR ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MISTY, TrainerType.KOFU ]
  },
  [BiomeId.LAKE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER, TrainerType.FISHERMAN, TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CRASHER_WAKE ]
  },
  [BiomeId.SEABED]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SWIMMER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JUAN ]
  },
  [BiomeId.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.BLACK_BELT, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.PILOT ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.FALKNER, TrainerType.WINONA, TrainerType.SKYLA ]
  },
  [BiomeId.BADLANDS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CLAY, TrainerType.GRANT ]
  },
  [BiomeId.CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.HIKER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BROCK, TrainerType.ROXANNE, TrainerType.ROARK ]
  },
  [BiomeId.DESERT]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.SCIENTIST ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GORDIE ]
  },
  [BiomeId.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SNOW_WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.PRYCE, TrainerType.BRYCEN, TrainerType.WULFRIC, TrainerType.GRUSHA ]
  },
  [BiomeId.MEADOW]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY, TrainerType.MUSICIAN, TrainerType.PARASOL_LADY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BAKER, TrainerType.BREEDER, TrainerType.POKEFAN ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.LENORA, TrainerType.MILO ]
  },
  [BiomeId.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: [ TrainerType.GUITARIST, TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.VOLKNER, TrainerType.ELESA, TrainerType.CLEMONT ]
  },
  [BiomeId.VOLCANO]: {
    [BiomePoolTier.COMMON]: [ TrainerType.FIREBREATHER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BLAINE, TrainerType.FLANNERY, TrainerType.KABU ]
  },
  [BiomeId.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PSYCHIC ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.HEX_MANIAC ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MORTY, TrainerType.ALLISTER, TrainerType.RYME ]
  },
  [BiomeId.DOJO]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.BRAWLY, TrainerType.MAYLENE, TrainerType.KORRINA, TrainerType.BEA ]
  },
  [BiomeId.FACTORY]: {
    [BiomePoolTier.COMMON]: [ TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JASMINE, TrainerType.BYRON ]
  },
  [BiomeId.RUINS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PSYCHIC, TrainerType.SCIENTIST ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BLACK_BELT, TrainerType.HEX_MANIAC ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.SABRINA, TrainerType.TATE, TrainerType.LIZA, TrainerType.TULIP ]
  },
  [BiomeId.WASTELAND]: {
    [BiomePoolTier.COMMON]: [ TrainerType.VETERAN ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CLAIR, TrainerType.DRAYDEN, TrainerType.RAIHAN ]
  },
  [BiomeId.ABYSS]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MARNIE ]
  },
  [BiomeId.SPACE]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.OLYMPIA ]
  },
  [BiomeId.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.OFFICER, TrainerType.WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.LT_SURGE, TrainerType.CHUCK, TrainerType.WATTSON ]
  },
  [BiomeId.JUNGLE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BACKPACKER, TrainerType.RANGER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.RAMOS ]
  },
  [BiomeId.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BEAUTY ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER, TrainerType.BREEDER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.VALERIE, TrainerType.OPAL, TrainerType.BEDE ]
  },
  [BiomeId.TEMPLE]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.FANTINA ]
  },
  [BiomeId.SLUM]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BIKER, TrainerType.OFFICER, TrainerType.ROUGHNECK ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BAKER, TrainerType.HOOLIGANS ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.PIERS ]
  },
  [BiomeId.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SNOW_WORKER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CANDICE, TrainerType.MELONY ]
  },
  [BiomeId.ISLAND]: {
    [BiomePoolTier.COMMON]: [ TrainerType.RICH_KID ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.RICH ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.NESSA ]
  },
  [BiomeId.LABORATORY]: {
    [BiomePoolTier.COMMON]: [ TrainerType.SCIENTIST ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.GIOVANNI ]
  },
  [BiomeId.END]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: []
  }
};

  biomeDepths[BiomeId.TOWN] = [ 0, 1 ];

  const traverseBiome = (biome: BiomeId, depth: number) => {
    if (biome === BiomeId.END) {
      const biomeList = getEnumValues(BiomeId)
      biomeList.pop(); // Removes BiomeId.END from the list
      const randIndex = randSeedInt(biomeList.length, 1); // Will never be BiomeId.TOWN
      biome = biomeList[randIndex];
    }
    const linkedBiomes: (BiomeId | [ BiomeId, number ])[] = Array.isArray(biomeLinks[biome])
      ? biomeLinks[biome] as (BiomeId | [ BiomeId, number ])[]
      : [ biomeLinks[biome] as BiomeId ];
    for (const linkedBiomeEntry of linkedBiomes) {
      const linkedBiome = !Array.isArray(linkedBiomeEntry)
        ? linkedBiomeEntry as BiomeId
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

  traverseBiome(BiomeId.TOWN, 0);
  biomeDepths[BiomeId.END] = [ Object.values(biomeDepths).map(d => d[0]).reduce((max: number, value: number) => Math.max(max, value), 0) + 1, 1 ];

  for (const biome of getEnumValues(BiomeId)) {
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
    const biomeEntries = pb[3] as (BiomeId | BiomePoolTier)[][];

    const speciesEvolutions: SpeciesFormEvolution[] = pokemonEvolutions.hasOwnProperty(speciesId)
      ? pokemonEvolutions[speciesId]
      : [];

    if (!biomeEntries.filter(b => b[0] !== BiomeId.END).length && !speciesEvolutions.filter(es => !!((pokemonBiomes.find(p => p[0] === es.speciesId)!)[3] as any[]).filter(b => b[0] !== BiomeId.END).length).length) { // TODO: is the bang on the `find()` correct?
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
        biome: biome as BiomeId,
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
  //     const biome = BiomeId[b];
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
  //             pokemonOutput[biome][tier][timeOfDay].push(SpeciesId[f]);
  //           } else {
  //             const tree = {};

  //             for (const l of Object.keys(f)) {
  //               tree[l] = f[l].map(s => SpeciesId[s]);
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

  //   console.log(beautify(pokemonOutput, null, 2, 180).replace(/(        |        (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |(?:,|\[) (?:"\w+": \[ |(?:\{ )?"\d+": \[ )?)"(\w+)"(?= |,|\n)/g, "$1SpeciesId.$2").replace(/"(\d+)": /g, "$1: ").replace(/((?:      )|(?:(?!\n)    "(?:.*?)": \{) |\[(?: .*? )?\], )"(\w+)"/g, "$1[TimeOfDay.$2]").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[BiomeId.$2]"));
  //   console.log(beautify(trainerOutput, null, 2, 120).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, "$1TrainerType.$2").replace(/"(\d+)": /g, "$1: ").replace(/(    )"(.*?)"/g, "$1[BiomePoolTier.$2]").replace(/(  )"(.*?)"/g, "$1[BiomeId.$2]"));
  // }

  /*for (let pokemon of allSpecies) {
    if (pokemon.speciesId >= SpeciesId.XERNEAS)
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
