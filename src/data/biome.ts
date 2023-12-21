import { pokemonEvolutions, SpeciesEvolution } from "./pokemon-evolutions";
import { Species } from "./species";
import { Type } from './type';
import * as Utils from '../utils';

import beautify from 'json-beautify';
import { TrainerType } from "./trainer-type";

export enum Biome {
  TOWN,
  PLAINS,
  GRASS,
  TALL_GRASS,
  METROPOLIS,
  FOREST,
  SEA,
  SWAMP,
  BEACH,
  LAKE,
  SEABED,
  MOUNTAIN,
  BADLANDS,
  CAVE,
  DESERT,
  ICE_CAVE,
  MEADOW,
  POWER_PLANT,
  VOLCANO,
  GRAVEYARD,
  DOJO,
  FACTORY,
  RUINS,
  WASTELAND,
  ABYSS,
  SPACE,
  CONSTRUCTION_SITE,
  JUNGLE,
  FAIRY_CAVE,
  TEMPLE,
  SLUM,
  SNOWY_FOREST,
  ISLAND = 40,
  LABORATORY,
  END = 50
};

export function getBiomeName(biome: Biome) {
  switch (biome) {
    case Biome.GRASS:
      return 'Grassy Field';
    case Biome.RUINS:
      return 'Ancient Ruins';
    case Biome.ABYSS:
      return 'The Abyss';
    case Biome.SPACE:
      return 'Stratosphere';
    case Biome.END:
      return 'Final Destination';
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
  [Biome.LAKE]: [ Biome.BEACH, Biome.SWAMP ],
  [Biome.SEABED]: [ Biome.CAVE, [ Biome.VOLCANO, 4 ] ],
  [Biome.MOUNTAIN]: [ Biome.VOLCANO, [ Biome.WASTELAND, 3 ] ],
  [Biome.BADLANDS]: [ Biome.DESERT, Biome.MOUNTAIN ],
  [Biome.CAVE]: [ Biome.BADLANDS, Biome.BEACH ],
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
  [Biome.SNOWY_FOREST]: Biome.LAKE,
  [Biome.ISLAND]: Biome.SEA,
  [Biome.LABORATORY]: Biome.METROPOLIS
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
};

export const uncatchableSpecies: Species[] = [];

export interface SpeciesTree {
  [key: integer]: Species[]
}

export interface BiomeTierPokemonPools {
  [key: integer]: Array<Species | SpeciesTree>
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
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.CATERPIE ], 7: [ Species.METAPOD ] },
      { 1: [ Species.WEEDLE ], 7: [ Species.KAKUNA ] },
      Species.PIDGEY,
      Species.RATTATA,
      Species.SPEAROW,
      Species.SENTRET,
      Species.HOOTHOOT,
      Species.LEDYBA,
      Species.HOPPIP,
      Species.SUNKERN,
      Species.POOCHYENA,
      Species.ZIGZAGOON,
      { 1: [ Species.WURMPLE ], 7: [ Species.CASCOON, Species.SILCOON ] },
      Species.TAILLOW,
      Species.STARLY,
      Species.BIDOOF,
      Species.PATRAT,
      Species.LILLIPUP,
      Species.PURRLOIN,
      Species.PIDOVE,
      Species.COTTONEE,
      Species.FLETCHLING,
      { 1: [ Species.SCATTERBUG ], 9: [ Species.SPEWPA ] },
      Species.YUNGOOS,
      Species.SKWOVET,
      Species.ROOKIDEE,
      Species.BLIPBUG,
      Species.WOOLOO
    ],
    [BiomePoolTier.UNCOMMON]: [
      Species.EKANS,
      Species.NIDORAN_F,
      Species.NIDORAN_M,
      Species.ODDISH,
      Species.PARAS,
      Species.VENONAT,
      Species.MEOWTH,
      Species.BELLSPROUT,
      Species.LOTAD,
      Species.SEEDOT,
      Species.SHROOMISH,
      Species.NINCADA,
      Species.WHISMUR,
      Species.SKITTY,
      Species.KRICKETOT,
      Species.COMBEE,
      Species.CHERUBI,
      Species.VENIPEDE,
      Species.MINCCINO
    ],
    [BiomePoolTier.RARE]: [ Species.ABRA, Species.SURSKIT ],
    [BiomePoolTier.SUPER_RARE]: [ Species.EEVEE, Species.RALTS ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DITTO ],
    [BiomePoolTier.BOSS]: [],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.PLAINS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MEOWTH ], 28: [ Species.PERSIAN ] },
      { 1: [ Species.SENTRET ], 15: [ Species.FURRET ] },
      { 1: [ Species.POOCHYENA ], 18: [ Species.MIGHTYENA ] },
      { 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ] },
      { 1: [ Species.BIDOOF ], 15: [ Species.BIBAREL ] },
      { 1: [ Species.YUNGOOS ], 30: [ Species.GUMSHOOS ] },
      { 1: [ Species.SKWOVET ], 24: [ Species.GREEDENT ] },
      { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] },
      { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] },
      Species.PIKACHU,
      { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 40: [ Species.ANNIHILAPE ] },
      { 1: [ Species.DODUO ], 31: [ Species.DODRIO ] },
      { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
      { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
      { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ] },
      { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] }
    ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] }, { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] }, { 1: [ Species.BUNEARY ], 20: [ Species.LOPUNNY ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.FARFETCHD, Species.LICKITUNG, Species.CHANSEY, Species.EEVEE, Species.SNORLAX, { 1: [ Species.DUNSPARCE ], 40: [ Species.DUDUNSPARCE ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DITTO, Species.LATIAS, Species.LATIOS ],
    [BiomePoolTier.BOSS]: [ Species.PERSIAN, Species.DODRIO, Species.FURRET, Species.MIGHTYENA, Species.LINOONE, Species.BIBAREL, Species.LOPUNNY, Species.GUMSHOOS, Species.GREEDENT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.FARFETCHD, Species.SNORLAX, Species.LICKILICKY, Species.LYCANROC, Species.DUDUNSPARCE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.LATIAS, Species.LATIOS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.HOPPIP ], 18: [ Species.SKIPLOOM ] },
      Species.SUNKERN,
      { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] },
      { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] },
      { 1: [ Species.COTTONEE ], 20: [ Species.WHIMSICOTT ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] }, { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] }, { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.BULBASAUR ], 16: [ Species.IVYSAUR ], 32: [ Species.VENUSAUR ] }, Species.GROWLITHE, { 1: [ Species.TURTWIG ], 18: [ Species.GROTLE ], 32: [ Species.TORTERRA ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SUDOWOODO ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.VENUSAUR, Species.SUDOWOODO, Species.TORTERRA ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.NIDORAN_F ], 16: [ Species.NIDORINA ] },
      { 1: [ Species.NIDORAN_M ], 16: [ Species.NIDORINO ] },
      { 1: [ Species.ODDISH ], 21: [ Species.GLOOM ] },
      { 1: [ Species.NINCADA ], 20: [ Species.NINJASK ] },
      { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ] },
      { 1: [ Species.FOMANTIS ], 44: [ Species.LURANTIS ] },
      { 1: [ Species.BOUNSWEET ], 18: [ Species.STEENEE ], 30: [ Species.TSAREENA ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.VULPIX, { 1: [ Species.PARAS ], 24: [ Species.PARASECT ] }, { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ] }, { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] } ],
    [BiomePoolTier.RARE]: [ Species.PINSIR, { 1: [ Species.CHIKORITA ], 16: [ Species.BAYLEEF ], 32: [ Species.MEGANIUM ] }, { 1: [ Species.GIRAFARIG ], 40: [ Species.FARIGIRAF ] }, Species.ZANGOOSE, Species.KECLEON, Species.TROPIUS ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SCYTHER, Species.SHEDINJA ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.NIDOQUEEN, Species.NIDOKING, Species.VILEPLUME, Species.NINJASK, Species.ZANGOOSE, Species.KECLEON, Species.KRICKETUNE, Species.LURANTIS, Species.TSAREENA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.PINSIR, Species.MEGANIUM, Species.BELLOSSOM, Species.FARIGIRAF ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ] },
      { 1: [ Species.ZIGZAGOON ], 20: [ Species.LINOONE ] },
      { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] },
      { 1: [ Species.LILLIPUP ], 16: [ Species.HERDIER ], 32: [ Species.STOUTLAND ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.PIKACHU, { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ] }, Species.FURFROU, Species.INDEEDEE ],
    [BiomePoolTier.RARE]: [ Species.MORPEKO ],
    [BiomePoolTier.SUPER_RARE]: [ Species.DITTO, Species.EEVEE, Species.SMEARGLE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.CASTFORM ],
    [BiomePoolTier.BOSS]: [ Species.STOUTLAND, Species.FURFROU ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CASTFORM ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.FOREST]: {
    [BiomePoolTier.COMMON]: [
      Species.BUTTERFREE,
      Species.BEEDRILL,
      { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ] },
      { 1: [ Species.BELLSPROUT ], 21: [ Species.WEEPINBELL ] },
      { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] },
      { 1: [ Species.PINECO ], 31: [ Species.FORRETRESS ] },
      Species.BEAUTIFLY,
      Species.DUSTOX,
      { 1: [ Species.SEEDOT ], 14: [ Species.NUZLEAF ] },
      { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] },
      { 1: [ Species.COMBEE ], 21: [ Species.VESPIQUEN ] },
      { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ] },
      Species.PETILIL,
      { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ] },
      Species.VIVILLON
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] },
      { 1: [ Species.HOOTHOOT ], 20: [ Species.NOCTOWL ] },
      { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
      Species.ROSELIA,
      { 1: [ Species.BURMY ], 20: [ Species.MOTHIM, Species.WORMADAM ] },
      { 1: [ Species.PANSAGE ], 20: [ Species.SIMISAGE ] },
      { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] },
      { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] },
      { 1: [ Species.DOTTLER ], 30: [ Species.ORBEETLE ] }
    ],
    [BiomePoolTier.RARE]: [
      Species.EXEGGCUTE,
      Species.SCYTHER,
      Species.HERACROSS,
      Species.STANTLER,
      { 1: [ Species.TREECKO ], 16: [ Species.GROVYLE ], 36: [ Species.SCEPTILE ] },
      Species.TROPIUS,
      Species.KARRABLAST,
      Species.SHELMET,
      { 1: [ Species.CHESPIN ], 16: [ Species.QUILLADIN ], 36: [ Species.CHESNAUGHT ] },
      { 1: [ Species.ROWLET ], 17: [ Species.DARTRIX ], 36: [ Species.DECIDUEYE ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.DURANT ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.KARTANA ],
    [BiomePoolTier.BOSS]: [
      Species.VENOMOTH,
      Species.VICTREEBEL,
      Species.NOCTOWL,
      Species.ARIADOS,
      Species.FORRETRESS,
      Species.BEAUTIFLY,
      Species.DUSTOX,
      Species.SHIFTRY,
      Species.BRELOOM,
      Species.WORMADAM,
      Species.MOTHIM,
      Species.VESPIQUEN,
      Species.SIMISAGE,
      Species.SCOLIPEDE,
      Species.LILLIGANT,
      Species.SAWSBUCK,
      Species.ORBEETLE
    ],
    [BiomePoolTier.BOSS_RARE]: [ Species.HERACROSS, Species.STANTLER, Species.SCEPTILE, Species.ESCAVALIER, Species.ACCELGOR, Species.DURANT, Species.CHESNAUGHT, Species.DECIDUEYE, Species.LYCANROC ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.KARTANA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.CALYREX ]
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] },
      { 1: [ Species.HORSEA ], 32: [ Species.SEADRA ] },
      { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ] },
      { 1: [ Species.BUIZEL ], 26: [ Species.FLOATZEL ] },
      { 1: [ Species.FINNEON ], 31: [ Species.LUMINEON ] },
      { 1: [ Species.INKAY ], 30: [ Species.MALAMAR ] },
      Species.CRAMORANT
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ] },
      { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] },
      Species.SHELLDER,
      { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
      { 1: [ Species.STARYU ], 20: [ Species.STARMIE ] },
      { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] },
      { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ] },
      { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] },
      { 1: [ Species.PANPOUR ], 20: [ Species.SIMIPOUR ] }
    ],
    [BiomePoolTier.RARE]: [ Species.LAPRAS, { 1: [ Species.PIPLUP ], 16: [ Species.PRINPLUP ], 36: [ Species.EMPOLEON ] }, { 1: [ Species.POPPLIO ], 17: [ Species.BRIONNE ], 36: [ Species.PRIMARINA ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.KINGDRA, { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] } ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.TENTACRUEL, Species.PELIPPER, Species.SHARPEDO, Species.FLOATZEL, Species.LUMINEON, Species.SIMIPOUR, Species.MALAMAR, Species.CRAMORANT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.KINGDRA, Species.EMPOLEON, Species.PRIMARINA ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.LUGIA ]
  },
  [Biome.SWAMP]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] },
      { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ] },
      { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] },
      { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] },
      { 1: [ Species.GULPIN ], 26: [ Species.SWALOT ] },
      { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ] },
      { 1: [ Species.TYMPOLE ], 25: [ Species.PALPITOAD ], 36: [ Species.SEISMITOAD ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ] },
      { 1: [ Species.BARBOACH ], 30: [ Species.WHISCASH ] },
      { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
      { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] },
      Species.STUNFISK,
      { 1: [ Species.MAREANIE ], 38: [ Species.TOXAPEX ] }
    ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.TOTODILE ], 18: [ Species.CROCONAW ], 30: [ Species.FERALIGATR ] }, { 1: [ Species.MUDKIP ], 16: [ Species.MARSHTOMP ], 36: [ Species.SWAMPERT ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.POLITOED, { 1: [ Species.GALAR_SLOWPOKE ], 37: [ Species.GALAR_SLOWBRO ] }, Species.GALAR_STUNFISK, Species.HISUI_SLIGGOO, Species.HISUI_GOODRA ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.AZELF, Species.POIPOLE ],
    [BiomePoolTier.BOSS]: [ Species.ARBOK, Species.POLIWRATH, Species.QUAGSIRE, Species.LUDICOLO, Species.SWALOT, Species.WHISCASH, Species.GASTRODON, Species.SEISMITOAD, Species.STUNFISK, Species.TOXAPEX ],
    [BiomePoolTier.BOSS_RARE]: [ Species.FERALIGATR, Species.POLITOED, Species.SWAMPERT ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.AZELF, Species.NAGANADEL, Species.GALAR_SLOWBRO, Species.GALAR_SLOWKING, Species.GALAR_STUNFISK, Species.HISUI_GOODRA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: [
      Species.SHELLDER,
      { 1: [ Species.KRABBY ], 28: [ Species.KINGLER ] },
      { 1: [ Species.STARYU ], 20: [ Species.STARMIE ] },
      { 1: [ Species.CORPHISH ], 30: [ Species.CRAWDAUNT ] },
      { 1: [ Species.DWEBBLE ], 34: [ Species.CRUSTLE ] },
      { 1: [ Species.BINACLE ], 39: [ Species.BARBARACLE ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] }, { 1: [ Species.CLAUNCHER ], 37: [ Species.CLAWITZER ] }, { 1: [ Species.SANDYGAST ], 48: [ Species.PALOSSAND ] } ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.KELDEO ],
    [BiomePoolTier.BOSS]: [ Species.CLOYSTER, Species.KINGLER, Species.STARMIE, Species.CRAWDAUNT, Species.WORMADAM, Species.CRUSTLE, Species.BARBARACLE, Species.CLAWITZER, Species.PALOSSAND ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CARRACOSTA ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.KELDEO ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ] },
      { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
      { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] },
      { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] },
      { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] },
      { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ] },
      { 1: [ Species.CHEWTLE ], 22: [ Species.DREDNAW ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] },
      { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] },
      { 1: [ Species.SURSKIT ], 22: [ Species.MASQUERAIN ] },
      Species.WISHIWASHI,
      { 1: [ Species.DEWPIDER ], 22: [ Species.ARAQUANID ] }
    ],
    [BiomePoolTier.RARE]: [
      { 1: [ Species.SQUIRTLE ], 16: [ Species.WARTORTLE ], 36: [ Species.BLASTOISE ] },
      { 1: [ Species.OSHAWOTT ], 17: [ Species.DEWOTT ], 36: [ Species.SAMUROTT ] },
      { 1: [ Species.FROAKIE ], 16: [ Species.FROGADIER ], 36: [ Species.GRENINJA ] },
      { 1: [ Species.SOBBLE ], 16: [ Species.DRIZZILE ], 35: [ Species.INTELEON ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.VAPOREON, Species.SLOWKING ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.SUICUNE, Species.MESPRIT ],
    [BiomePoolTier.BOSS]: [ Species.GOLDUCK, Species.SLOWBRO, Species.SEAKING, Species.GYARADOS, Species.AZUMARILL, Species.MASQUERAIN, Species.SWANNA, Species.WISHIWASHI, Species.ARAQUANID, Species.DREDNAW ],
    [BiomePoolTier.BOSS_RARE]: [ Species.BLASTOISE, Species.VAPOREON, Species.SLOWKING, Species.SAMUROTT, Species.GRENINJA, Species.INTELEON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.SUICUNE, Species.MESPRIT, Species.HISUI_SAMUROTT ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ] },
      Species.REMORAID,
      Species.CLAMPERL,
      Species.BASCULIN,
      { 1: [ Species.FRILLISH ], 40: [ Species.JELLICENT ] },
      { 1: [ Species.ARROKUDA ], 26: [ Species.BARRASKEWDA ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] },
      Species.SHELLDER,
      { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] },
      Species.LUVDISC,
      { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ] },
      { 1: [ Species.SKRELP ], 48: [ Species.DRAGALGE ] },
      Species.PINCURCHIN
    ],
    [BiomePoolTier.RARE]: [ Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, { 1: [ Species.MANTYKE ], 20: [ Species.MANTINE ] }, Species.ALOMOMOLA, { 1: [ Species.TYNAMO ], 39: [ Species.EELEKTRIK ] }, Species.DHELMISE ],
    [BiomePoolTier.SUPER_RARE]: [
      { 1: [ Species.OMANYTE ], 40: [ Species.OMASTAR ] },
      { 1: [ Species.KABUTO ], 40: [ Species.KABUTOPS ] },
      Species.RELICANTH,
      Species.PYUKUMUKU,
      { 1: [ Species.GALAR_CORSOLA ], 38: [ Species.CURSOLA ] },
      Species.ARCTOVISH,
      Species.HISUI_QWILFISH
    ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.FEEBAS, Species.NIHILEGO ],
    [BiomePoolTier.BOSS]: [ Species.LANTURN, Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, Species.MANTINE, Species.WAILORD, Species.HUNTAIL, Species.GOREBYSS, Species.LUVDISC, Species.JELLICENT, Species.ALOMOMOLA, Species.DRAGALGE, Species.BARRASKEWDA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.OMASTAR, Species.KABUTOPS, Species.RELICANTH, Species.EELEKTROSS, Species.PYUKUMUKU, Species.DHELMISE, Species.ARCTOVISH, Species.BASCULEGION ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MILOTIC, Species.NIHILEGO, Species.CURSOLA, Species.OVERQWIL ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.KYOGRE ]
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] },
      { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] },
      { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ] },
      { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] },
      { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
      { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] },
      { 1: [ Species.FLETCHLING ], 17: [ Species.FLETCHINDER ], 35: [ Species.TALONFLAME ] },
      { 1: [ Species.SKIDDO ], 32: [ Species.GOGOAT ] },
      { 1: [ Species.ROOKIDEE ], 18: [ Species.CORVISQUIRE ], 38: [ Species.CORVIKNIGHT ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
      { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
      { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
      { 1: [ Species.NATU ], 25: [ Species.XATU ] },
      { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ] },
      { 1: [ Species.ARON ], 32: [ Species.LAIRON ], 42: [ Species.AGGRON ] },
      { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
      { 1: [ Species.RUFFLET ], 54: [ Species.BRAVIARY ] },
      Species.MANDIBUZZ
    ],
    [BiomePoolTier.RARE]: [ Species.MURKROW, Species.SKARMORY, { 1: [ Species.TORCHIC ], 16: [ Species.COMBUSKEN ], 36: [ Species.BLAZIKEN ] }, { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ] }, Species.VULLABY, Species.HAWLUCHA ],
    [BiomePoolTier.SUPER_RARE]: [
      { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ] },
      { 1: [ Species.CRANIDOS ], 30: [ Species.RAMPARDOS ] },
      { 1: [ Species.SHIELDON ], 30: [ Species.BASTIODON ] },
      { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
      Species.ARCHEOPS,
      { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ] }
    ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.TORNADUS ],
    [BiomePoolTier.BOSS]: [ Species.PIDGEOT, Species.FEAROW, Species.SKARMORY, Species.SWELLOW, Species.AGGRON, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.MANDIBUZZ, Species.TALONFLAME, Species.GOGOAT, Species.CORVIKNIGHT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.BLAZIKEN, Species.RAMPARDOS, Species.BASTIODON, Species.HAWLUCHA, Species.HISUI_BRAVIARY ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.TORNADUS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.HO_OH ]
  },
  [Biome.BADLANDS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.DIGLETT ], 26: [ Species.DUGTRIO ] },
      { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
      { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] },
      { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
      { 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ] },
      { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ] },
      { 1: [ Species.MUDBRAY ], 30: [ Species.MUDSDALE ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] },
      { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] },
      { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
      { 1: [ Species.SIZZLIPEDE ], 28: [ Species.CENTISKORCH ] },
      { 1: [ Species.CUFANT ], 34: [ Species.COPPERAJAH ] }
    ],
    [BiomePoolTier.RARE]: [ Species.ONIX, Species.GLIGAR ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.LANDORUS ],
    [BiomePoolTier.BOSS]: [ Species.DUGTRIO, Species.GOLEM, Species.MAROWAK, Species.DONPHAN, Species.RHYPERIOR, Species.GLISCOR, Species.EXCADRILL, Species.MUDSDALE, Species.CENTISKORCH, Species.COPPERAJAH ],
    [BiomePoolTier.BOSS_RARE]: [ Species.STEELIX ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.LANDORUS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.GROUDON ]
  },
  [Biome.CAVE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.ZUBAT ], 22: [ Species.GOLBAT ] },
      { 1: [ Species.PARAS ], 24: [ Species.PARASECT ] },
      { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
      { 1: [ Species.WHISMUR ], 20: [ Species.LOUDRED ], 40: [ Species.EXPLOUD ] },
      { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
      { 1: [ Species.WOOBAT ], 20: [ Species.SWOOBAT ] },
      { 1: [ Species.BUNNELBY ], 20: [ Species.DIGGERSBY ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
      { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] },
      Species.NOSEPASS,
      { 1: [ Species.NOIBAT ], 48: [ Species.NOIVERN ] },
      { 1: [ Species.ROCKRUFF ], 25: [ Species.LYCANROC ] },
      { 1: [ Species.WIMPOD ], 30: [ Species.GOLISOPOD ] }
    ],
    [BiomePoolTier.RARE]: [ Species.ONIX, { 1: [ Species.FERROSEED ], 40: [ Species.FERROTHORN ] }, Species.CARBINK ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SHUCKLE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.UXIE ],
    [BiomePoolTier.BOSS]: [ Species.PARASECT, Species.ONIX, Species.CROBAT, Species.URSARING, Species.EXPLOUD, Species.PROBOPASS, Species.GIGALITH, Species.SWOOBAT, Species.DIGGERSBY, Species.NOIVERN, Species.GOLISOPOD ],
    [BiomePoolTier.BOSS_RARE]: [ Species.SHUCKLE, Species.FERROTHORN, Species.LYCANROC ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.UXIE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] },
      Species.TRAPINCH,
      { 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ] },
      { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ] },
      { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
      { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] },
      { 1: [ Species.SILICOBRA ], 36: [ Species.SANDACONDA ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.MARACTUS, Species.HELIOPTILE ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] }, { 1: [ Species.DARUMAKA ], 35: [ Species.DARMANITAN ] } ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.LILEEP ], 40: [ Species.CRADILY ] }, { 1: [ Species.ANORITH ], 40: [ Species.ARMALDO ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGIROCK, Species.PHEROMOSA ],
    [BiomePoolTier.BOSS]: [ Species.SANDSLASH, Species.CACTURNE, Species.HIPPOWDON, Species.DRAPION, Species.KROOKODILE, Species.DARMANITAN, Species.MARACTUS, Species.HELIOLISK, Species.SANDACONDA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CRADILY, Species.ARMALDO ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.REGIROCK, Species.PHEROMOSA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.SEEL ], 34: [ Species.DEWGONG ] },
      { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ] },
      { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ] },
      { 1: [ Species.VANILLITE ], 35: [ Species.VANILLISH ], 47: [ Species.VANILLUXE ] },
      { 1: [ Species.CUBCHOO ], 37: [ Species.BEARTIC ] },
      { 1: [ Species.BERGMITE ], 37: [ Species.AVALUGG ] },
      Species.CRABRAWLER,
      { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.SNEASEL, { 1: [ Species.SNORUNT ], 42: [ Species.GLALIE ] }, { 1: [ Species.SPHEAL ], 32: [ Species.SEALEO ], 44: [ Species.WALREIN ] }, Species.EISCUE ],
    [BiomePoolTier.RARE]: [ Species.JYNX, Species.LAPRAS, Species.FROSLASS, Species.CRYOGONAL ],
    [BiomePoolTier.SUPER_RARE]: [ Species.DELIBIRD, { 1: [ Species.AMAURA ], 59: [ Species.AURORUS ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.ARTICUNO, Species.REGICE ],
    [BiomePoolTier.BOSS]: [ Species.DEWGONG, Species.GLALIE, Species.WALREIN, Species.WEAVILE, Species.MAMOSWINE, Species.FROSLASS, Species.VANILLUXE, Species.BEARTIC, Species.CRYOGONAL, Species.AVALUGG, Species.CRABOMINABLE ],
    [BiomePoolTier.BOSS_RARE]: [ Species.JYNX, Species.LAPRAS, Species.GLACEON, Species.AURORUS ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.ARTICUNO, Species.REGICE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.KYUREM ]
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.LEDYBA ], 18: [ Species.LEDIAN ] },
      Species.ROSELIA,
      { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ] },
      { 1: [ Species.COTTONEE ], 20: [ Species.WHIMSICOTT ] },
      Species.MINCCINO,
      { 1: [ Species.FLABEBE ], 19: [ Species.FLOETTE ] },
      { 1: [ Species.GOSSIFLEUR ], 20: [ Species.ELDEGOSS ] },
      { 1: [ Species.WOOLOO ], 24: [ Species.DUBWOOL ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ] },
      { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
      { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ], 30: [ Species.AMPHAROS ] },
      { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ] },
      { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ] },
      { 1: [ Species.SKITTY ], 20: [ Species.DELCATTY ] },
      { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ] },
      Species.BOUFFALANT
    ],
    [BiomePoolTier.RARE]: [ Species.TAUROS, Species.EEVEE, Species.MILTANK, Species.VOLBEAT, Species.ILLUMISE, Species.SPINDA, { 1: [ Species.APPLIN ], 30: [ Species.DIPPLIN ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.CHANSEY, Species.SYLVEON ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.MELOETTA ],
    [BiomePoolTier.BOSS]: [ Species.TAUROS, Species.LEDIAN, Species.GRANBULL, Species.MILTANK, Species.GARDEVOIR, Species.DELCATTY, Species.ROSERADE, Species.PURUGLY, Species.ZEBSTRIKA, Species.CINCCINO, Species.BOUFFALANT, Species.FLORGES, Species.DUBWOOL ],
    [BiomePoolTier.BOSS_RARE]: [ Species.BLISSEY, Species.SYLVEON, Species.FLAPPLE, Species.APPLETUN, Species.HYDRAPPLE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MELOETTA, Species.HISUI_LILLIGANT ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: [
      Species.PIKACHU,
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
      { 1: [ Species.ELECTRIKE ], 26: [ Species.MANECTRIC ] },
      { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] },
      Species.DEDENNE,
      { 1: [ Species.GRUBBIN ], 20: [ Species.CHARJABUG ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.ELECTABUZZ, Species.PLUSLE, Species.MINUN, Species.PACHIRISU, Species.EMOLGA, Species.TOGEDEMARU ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ] }, Species.HISUI_VOLTORB ],
    [BiomePoolTier.SUPER_RARE]: [ Species.JOLTEON ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ],
    [BiomePoolTier.BOSS]: [ Species.RAICHU, Species.MANECTRIC, Species.LUXRAY, Species.MAGNEZONE, Species.ELECTIVIRE, Species.DEDENNE, Species.VIKAVOLT, Species.TOGEDEMARU ],
    [BiomePoolTier.BOSS_RARE]: [ Species.JOLTEON, Species.AMPHAROS, Species.HISUI_ELECTRODE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.ZAPDOS, Species.RAIKOU, Species.THUNDURUS, Species.XURKITREE, Species.ZERAORA, Species.REGIELEKI ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.ZEKROM ]
  },
  [Biome.VOLCANO]: {
    [BiomePoolTier.COMMON]: [
      Species.VULPIX,
      Species.GROWLITHE,
      { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
      { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ] },
      { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] },
      { 1: [ Species.SALANDIT ], 33: [ Species.SALAZZLE ] },
      { 1: [ Species.ROLYCOLY ], 18: [ Species.CARKOL ], 34: [ Species.COALOSSAL ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.MAGMAR, Species.TORKOAL, { 1: [ Species.PANSEAR ], 20: [ Species.SIMISEAR ] }, Species.HEATMOR, Species.TURTONATOR ],
    [BiomePoolTier.RARE]: [
      { 1: [ Species.CHARMANDER ], 16: [ Species.CHARMELEON ], 36: [ Species.CHARIZARD ] },
      { 1: [ Species.CYNDAQUIL ], 14: [ Species.QUILAVA ], 36: [ Species.TYPHLOSION ] },
      { 1: [ Species.CHIMCHAR ], 14: [ Species.MONFERNO ], 36: [ Species.INFERNAPE ] },
      { 1: [ Species.TEPIG ], 17: [ Species.PIGNITE ], 36: [ Species.EMBOAR ] },
      { 1: [ Species.FENNEKIN ], 16: [ Species.BRAIXEN ], 36: [ Species.DELPHOX ] },
      { 1: [ Species.LITTEN ], 17: [ Species.TORRACAT ], 36: [ Species.INCINEROAR ] },
      { 1: [ Species.SCORBUNNY ], 16: [ Species.RABOOT ], 35: [ Species.CINDERACE ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.FLAREON, { 1: [ Species.LARVESTA ], 59: [ Species.VOLCARONA ] }, Species.HISUI_GROWLITHE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.ENTEI, Species.HEATRAN, Species.VOLCANION ],
    [BiomePoolTier.BOSS]: [ Species.NINETALES, Species.ARCANINE, Species.RAPIDASH, Species.MAGCARGO, Species.CAMERUPT, Species.TORKOAL, Species.MAGMORTAR, Species.SIMISEAR, Species.HEATMOR, Species.SALAZZLE, Species.TURTONATOR, Species.COALOSSAL ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CHARIZARD, Species.FLAREON, Species.TYPHLOSION, Species.INFERNAPE, Species.EMBOAR, Species.VOLCARONA, Species.DELPHOX, Species.INCINEROAR, Species.CINDERACE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MOLTRES, Species.ENTEI, Species.HEATRAN, Species.VOLCANION, Species.HISUI_ARCANINE, Species.HISUI_TYPHLOSION ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.RESHIRAM ]
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ] },
      { 1: [ Species.SHUPPET ], 37: [ Species.BANETTE ] },
      { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ] },
      { 1: [ Species.DRIFLOON ], 28: [ Species.DRIFBLIM ] },
      { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ] },
      Species.PHANTUMP,
      Species.PUMPKABOO
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] },
      { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] },
      { 1: [ Species.ESPURR ], 25: [ Species.MEOWSTIC ] },
      { 1: [ Species.SINISTEA ], 30: [ Species.POLTEAGEIST ] }
    ],
    [BiomePoolTier.RARE]: [ Species.MISDREAVUS, Species.MIMIKYU ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SPIRITOMB ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.MARSHADOW, Species.SPECTRIER ],
    [BiomePoolTier.BOSS]: [ Species.GENGAR, Species.BANETTE, Species.DRIFBLIM, Species.MISMAGIUS, Species.DUSKNOIR, Species.CHANDELURE, Species.MEOWSTIC, Species.TREVENANT, Species.GOURGEIST, Species.MIMIKYU, Species.POLTEAGEIST ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MARSHADOW, Species.SPECTRIER ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.GIRATINA, Species.CALYREX ]
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ], 40: [ Species.ANNIHILAPE ] },
      { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] },
      { 1: [ Species.MEDITITE ], 37: [ Species.MEDICHAM ] },
      { 1: [ Species.STUFFUL ], 27: [ Species.BEWEAR ] },
      { 1: [ Species.CLOBBOPUS ], 20: [ Species.GRAPPLOCT ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] }, { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ] }, { 1: [ Species.MIENFOO ], 50: [ Species.MIENSHAO ] } ],
    [BiomePoolTier.RARE]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.LUCARIO, Species.THROH, Species.SAWK ],
    [BiomePoolTier.SUPER_RARE]: [ Species.HITMONTOP, Species.GALLADE, Species.GALAR_FARFETCHD ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.TERRAKION, Species.KUBFU, Species.GALAR_ZAPDOS ],
    [BiomePoolTier.BOSS]: [ Species.HITMONLEE, Species.HITMONCHAN, Species.HARIYAMA, Species.MEDICHAM, Species.LUCARIO, Species.TOXICROAK, Species.THROH, Species.SAWK, Species.SCRAFTY, Species.MIENSHAO, Species.BEWEAR, Species.GRAPPLOCT, Species.ANNIHILAPE ],
    [BiomePoolTier.BOSS_RARE]: [ Species.HITMONTOP, Species.GALLADE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.TERRAKION, Species.SIRFETCHD, Species.URSHIFU, Species.HISUI_DECIDUEYE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.ZAMAZENTA, Species.GALAR_ZAPDOS ]
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
      { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] },
      { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, Species.KLEFKI ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.PORYGON ], 20: [ Species.PORYGON2 ] }, { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.GENESECT, Species.MAGEARNA ],
    [BiomePoolTier.BOSS]: [ Species.KLINKLANG, Species.KLEFKI ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.GENESECT, Species.MAGEARNA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.RUINS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.DROWZEE ], 26: [ Species.HYPNO ] },
      { 1: [ Species.NATU ], 25: [ Species.XATU ] },
      Species.UNOWN,
      { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ] },
      { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] },
      { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] }, Species.SIGILYPH ],
    [BiomePoolTier.RARE]: [ Species.MR_MIME, Species.WOBBUFFET, { 1: [ Species.GOTHITA ], 32: [ Species.GOTHORITA ], 41: [ Species.GOTHITELLE ] }, Species.STONJOURNER ],
    [BiomePoolTier.SUPER_RARE]: [ Species.ESPEON, { 1: [ Species.ARCHEN ], 37: [ Species.ARCHEOPS ] }, { 1: [ Species.GALAR_YAMASK ], 34: [ Species.RUNERIGUS ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGISTEEL ],
    [BiomePoolTier.BOSS]: [ Species.ALAKAZAM, Species.HYPNO, Species.XATU, Species.GRUMPIG, Species.CLAYDOL, Species.SIGILYPH, Species.GOTHITELLE, Species.BEHEEYEM ],
    [BiomePoolTier.BOSS_RARE]: [ Species.MR_MIME, Species.ESPEON, Species.WOBBUFFET, Species.ARCHEOPS ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.REGISTEEL, Species.RUNERIGUS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ] },
      { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] },
      { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ] },
      { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
      { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ], 48: [ Species.HAXORUS ] },
      { 1: [ Species.GOOMY ], 40: [ Species.SLIGGOO ], 80: [ Species.GOODRA ] },
      { 1: [ Species.JANGMO_O ], 35: [ Species.HAKAMO_O ], 45: [ Species.KOMMO_O ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] }, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] }, Species.DRAMPA ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.DRATINI ], 30: [ Species.DRAGONAIR ], 55: [ Species.DRAGONITE ] }, { 1: [ Species.DREEPY ], 50: [ Species.DRAKLOAK ], 60: [ Species.DRAGAPULT ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.AERODACTYL, Species.DRUDDIGON, { 1: [ Species.TYRUNT ], 59: [ Species.TYRANTRUM ] }, Species.DRACOZOLT, Species.DRACOVISH ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGIDRAGO ],
    [BiomePoolTier.BOSS]: [ Species.DRAGONITE, Species.TYRANITAR, Species.FLYGON, Species.SALAMENCE, Species.GARCHOMP, Species.HAXORUS, Species.GOODRA, Species.DRAMPA, Species.KOMMO_O, Species.DRAGAPULT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.AERODACTYL, Species.DRUDDIGON, Species.TYRANTRUM, Species.DRACOZOLT, Species.DRACOVISH ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.REGIDRAGO ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.DIALGA ]
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: [
      Species.MURKROW,
      { 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ] },
      Species.SABLEYE,
      { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] },
      { 1: [ Species.PAWNIARD ], 52: [ Species.BISHARP ], 64: [ Species.KINGAMBIT ] },
      { 1: [ Species.NICKIT ], 18: [ Species.THIEVUL ] },
      { 1: [ Species.IMPIDIMP ], 32: [ Species.MORGREM ], 42: [ Species.GRIMMSNARL ] }
    ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [ Species.ABSOL, Species.SPIRITOMB, { 1: [ Species.ZORUA ], 30: [ Species.ZOROARK ] }, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.UMBREON ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DARKRAI, Species.GUZZLORD, Species.GALAR_MOLTRES ],
    [BiomePoolTier.BOSS]: [ Species.HOUNDOOM, Species.SABLEYE, Species.ABSOL, Species.HONCHKROW, Species.SPIRITOMB, Species.LIEPARD, Species.ZOROARK, Species.HYDREIGON, Species.THIEVUL, Species.GRIMMSNARL, Species.KINGAMBIT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.UMBREON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.DARKRAI, Species.GUZZLORD ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.PALKIA, Species.YVELTAL, Species.GALAR_MOLTRES ]
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: [ Species.CLEFAIRY, Species.LUNATONE, Species.SOLROCK, { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, { 1: [ Species.MUNNA ], 30: [ Species.MUSHARNA ] }, Species.MINIOR ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] }, { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] }, Species.SIGILYPH, { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ] } ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.PORYGON ], 20: [ Species.PORYGON2 ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.CRESSELIA, { 1: [ Species.COSMOG ], 43: [ Species.COSMOEM ] }, Species.CELESTEELA ],
    [BiomePoolTier.BOSS]: [ Species.CLEFABLE, Species.LUNATONE, Species.SOLROCK, Species.BRONZONG, Species.MUSHARNA, Species.REUNICLUS, Species.MINIOR ],
    [BiomePoolTier.BOSS_RARE]: [ Species.METAGROSS, Species.PORYGON_Z ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.CRESSELIA, Species.CELESTEELA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.RAYQUAZA, Species.SOLGALEO, Species.LUNALA, Species.NECROZMA ]
  },
  [Biome.CONSTRUCTION_SITE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ] },
      { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
      { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ] },
      { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
      { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ] }
    ],
    [BiomePoolTier.RARE]: [ Species.ONIX, Species.HITMONLEE, Species.HITMONCHAN, Species.DURALUDON ],
    [BiomePoolTier.SUPER_RARE]: [ Species.DITTO, Species.HITMONTOP, { 1: [ Species.GALAR_MEOWTH ], 28: [ Species.PERRSERKER ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.COBALION ],
    [BiomePoolTier.BOSS]: [ Species.MACHAMP, Species.CONKELDURR ],
    [BiomePoolTier.BOSS_RARE]: [ Species.ARCHALUDON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.COBALION, Species.PERRSERKER ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.JUNGLE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] },
      Species.AIPOM,
      Species.SHROOMISH,
      Species.VESPIQUEN,
      { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] },
      { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] },
      { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ] },
      { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] },
      { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] },
      { 1: [ Species.PIKIPEK ], 14: [ Species.TRUMBEAK ], 36: [ Species.TOUCANNON ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      Species.EXEGGCUTE,
      Species.TANGELA,
      Species.TROPIUS,
      Species.COMBEE,
      { 1: [ Species.PANSAGE ], 20: [ Species.SIMISAGE ] },
      { 1: [ Species.PANSEAR ], 20: [ Species.SIMISEAR ] },
      { 1: [ Species.PANPOUR ], 20: [ Species.SIMIPOUR ] },
      { 1: [ Species.JOLTIK ], 36: [ Species.GALVANTULA ] },
      { 1: [ Species.LITLEO ], 35: [ Species.PYROAR ] },
      { 1: [ Species.PANCHAM ], 52: [ Species.PANGORO ] },
      Species.KOMALA,
      Species.FALINKS
    ],
    [BiomePoolTier.RARE]: [
      Species.SCYTHER,
      Species.YANMA,
      { 1: [ Species.SLAKOTH ], 18: [ Species.VIGOROTH ], 36: [ Species.SLAKING ] },
      Species.SEVIPER,
      Species.CARNIVINE,
      { 1: [ Species.SNIVY ], 17: [ Species.SERVINE ], 36: [ Species.SERPERIOR ] },
      Species.ORANGURU,
      Species.PASSIMIAN,
      { 1: [ Species.GROOKEY ], 16: [ Species.THWACKEY ], 35: [ Species.RILLABOOM ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.KANGASKHAN, Species.CHATOT, Species.KLEAVOR ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.VIRIZION, Species.BUZZWOLE, Species.ZARUDE ],
    [BiomePoolTier.BOSS]: [
      Species.EXEGGUTOR,
      Species.BRELOOM,
      Species.SEVIPER,
      Species.TROPIUS,
      Species.CHERRIM,
      Species.AMBIPOM,
      Species.CARNIVINE,
      Species.TANGROWTH,
      Species.YANMEGA,
      Species.LEAVANNY,
      Species.AMOONGUSS,
      Species.GALVANTULA,
      Species.PYROAR,
      Species.PANGORO,
      Species.TOUCANNON,
      Species.KOMALA,
      Species.FALINKS
    ],
    [BiomePoolTier.BOSS_RARE]: [ Species.KANGASKHAN, Species.SCIZOR, Species.SLAKING, Species.LEAFEON, Species.SERPERIOR, Species.RILLABOOM ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.VIRIZION, Species.BUZZWOLE, Species.ZARUDE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.KLEAVOR ]
  },
  [Biome.FAIRY_CAVE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ] },
      { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] },
      Species.MAWILE,
      { 1: [ Species.SPRITZEE ], 20: [ Species.AROMATISSE ] },
      { 1: [ Species.SWIRLIX ], 20: [ Species.SLURPUFF ] },
      { 1: [ Species.CUTIEFLY ], 25: [ Species.RIBOMBEE ] },
      { 1: [ Species.MORELULL ], 24: [ Species.SHIINOTIC ] },
      { 1: [ Species.MILCERY ], 20: [ Species.ALCREMIE ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      Species.CLEFAIRY,
      Species.TOGETIC,
      { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ] },
      Species.CARBINK,
      Species.COMFEY,
      { 1: [ Species.HATENNA ], 32: [ Species.HATTREM ], 42: [ Species.HATTERENE ] }
    ],
    [BiomePoolTier.RARE]: [ Species.AUDINO ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.GALAR_PONYTA ], 40: [ Species.GALAR_RAPIDASH ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DIANCIE, Species.ENAMORUS ],
    [BiomePoolTier.BOSS]: [ Species.WIGGLYTUFF, Species.MAWILE, Species.TOGEKISS, Species.AUDINO, Species.AROMATISSE, Species.SLURPUFF, Species.CARBINK, Species.RIBOMBEE, Species.SHIINOTIC, Species.COMFEY, Species.HATTERENE, Species.ALCREMIE ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.DIANCIE, Species.ENAMORUS, Species.GALAR_RAPIDASH ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.XERNEAS ]
  },
  [Biome.TEMPLE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ] },
      { 1: [ Species.NATU ], 25: [ Species.XATU ] },
      { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ] },
      { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] },
      { 1: [ Species.GOLETT ], 43: [ Species.GOLURK ] },
      { 1: [ Species.HONEDGE ], 35: [ Species.DOUBLADE ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] },
      { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] },
      { 1: [ Species.CHINGLING ], 20: [ Species.CHIMECHO ] },
      { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
      { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ] }
    ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.HOOPA, Species.TAPU_KOKO, Species.TAPU_LELE, Species.TAPU_BULU, Species.TAPU_FINI ],
    [BiomePoolTier.BOSS]: [ Species.CHIMECHO, Species.COFAGRIGUS, Species.GOLURK, Species.AEGISLASH ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.HOOPA, Species.TAPU_KOKO, Species.TAPU_LELE, Species.TAPU_BULU, Species.TAPU_FINI ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.REGIGIGAS ]
  },
  [Biome.SLUM]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ] },
      { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
      { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ] },
      { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] },
      { 1: [ Species.TRUBBISH ], 36: [ Species.GARBODOR ] },
      { 1: [ Species.YAMPER ], 25: [ Species.BOLTUND ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] }, { 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.TOXEL ], 30: [ Species.TOXTRICITY ] }, { 1: [ Species.GALAR_LINOONE ], 65: [ Species.OBSTAGOON ] }, Species.GALAR_ZIGZAGOON ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.MUK, Species.WEEZING, Species.WORMADAM, Species.SKUNTANK, Species.WATCHOG, Species.GARBODOR, Species.BOLTUND ],
    [BiomePoolTier.BOSS_RARE]: [ Species.TOXTRICITY, Species.OBSTAGOON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.GALAR_WEEZING ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SNOWY_FOREST]: {
    [BiomePoolTier.COMMON]: [
      Species.SNEASEL,
      { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
      { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ] },
      { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ] },
      { 1: [ Species.SNOM ], 20: [ Species.FROSMOTH ] },
      Species.EISCUE
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.STANTLER ],
    [BiomePoolTier.RARE]: [
      Species.DELIBIRD,
      { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ] },
      { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ] },
      { 1: [ Species.GALAR_DARUMAKA ], 30: [ Species.GALAR_DARMANITAN ] },
      Species.HISUI_AVALUGG
    ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.GALAR_MR_MIME ], 42: [ Species.MR_RIME ] }, Species.ARCTOZOLT, Species.HISUI_SNEASEL, { 1: [ Species.HISUI_ZORUA ], 30: [ Species.HISUI_ZOROARK ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.GLASTRIER, Species.GALAR_ARTICUNO ],
    [BiomePoolTier.BOSS]: [ Species.ABOMASNOW, Species.FROSMOTH, Species.WYRDEER, Species.URSALUNA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.ARCTOZOLT, Species.ALOLA_SANDSLASH, Species.ALOLA_NINETALES ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MR_RIME, Species.GLASTRIER, Species.SNEASLER, Species.GALAR_DARMANITAN, Species.HISUI_ZOROARK ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.ZACIAN, Species.CALYREX, Species.GALAR_ARTICUNO ]
  },
  [Biome.ISLAND]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.ALOLA_RATTATA ], 30: [ Species.ALOLA_RATICATE ] },
      { 1: [ Species.ALOLA_SANDSHREW ], 30: [ Species.ALOLA_SANDSLASH ] },
      { 1: [ Species.ALOLA_VULPIX ], 30: [ Species.ALOLA_NINETALES ] },
      { 1: [ Species.ALOLA_DIGLETT ], 26: [ Species.ALOLA_DUGTRIO ] },
      { 1: [ Species.ALOLA_MEOWTH ], 30: [ Species.ALOLA_PERSIAN ] },
      { 1: [ Species.ALOLA_GEODUDE ], 20: [ Species.ALOLA_GOLEM ], 25: [ Species.ALOLA_GRAVELER ] },
      { 1: [ Species.ALOLA_GRIMER ], 38: [ Species.ALOLA_MUK ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.ORICORIO, Species.BRUXISH, Species.ALOLA_RAICHU, Species.ALOLA_EXEGGUTOR, Species.ALOLA_MAROWAK ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.STAKATAKA, Species.BLACEPHALON ],
    [BiomePoolTier.BOSS]: [
      Species.ORICORIO,
      Species.BRUXISH,
      Species.ALOLA_RATICATE,
      Species.ALOLA_RAICHU,
      Species.ALOLA_SANDSLASH,
      Species.ALOLA_NINETALES,
      Species.ALOLA_DUGTRIO,
      Species.ALOLA_PERSIAN,
      Species.ALOLA_GOLEM,
      Species.ALOLA_MUK,
      Species.ALOLA_EXEGGUTOR,
      Species.ALOLA_MAROWAK
    ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.STAKATAKA, Species.BLACEPHALON ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.LABORATORY]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.GRIMER ], 38: [ Species.MUK ] },
      { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
      { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] },
      { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ] } ],
    [BiomePoolTier.RARE]: [ Species.DITTO, { 1: [ Species.PORYGON ], 20: [ Species.PORYGON2 ] } ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.ROTOM, Species.TYPE_NULL ],
    [BiomePoolTier.BOSS]: [ Species.MUK, Species.ELECTRODE, Species.BRONZONG, Species.MAGNEZONE, Species.PORYGON_Z, Species.REUNICLUS, Species.KLINKLANG ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.ROTOM, Species.ZYGARDE, Species.SILVALLY ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.MEWTWO ]
  },
  [Biome.END]: {
    [BiomePoolTier.COMMON]: [
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
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.ROARING_MOON, Species.IRON_VALIANT ],
    [BiomePoolTier.RARE]: [ Species.WALKING_WAKE, Species.IRON_LEAVES ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.ETERNATUS ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
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
    [BiomePoolTier.BOSS]: [ TrainerType.CILAN, TrainerType.CHILI, TrainerType.CRESS, TrainerType.CHEREN, TrainerType.LENORA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.GRASS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.BREEDER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.ACE_TRAINER ],
    [BiomePoolTier.RARE]: [ TrainerType.BLACK_BELT ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.ERIKA, TrainerType.GARDENIA ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.ERIKA, TrainerType.GARDENIA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.METROPOLIS]: {
    [BiomePoolTier.COMMON]: [ TrainerType.CLERK, TrainerType.CYCLIST, TrainerType.OFFICER ],
    [BiomePoolTier.UNCOMMON]: [ TrainerType.BREEDER, TrainerType.DEPOT_AGENT, TrainerType.GUITARIST ],
    [BiomePoolTier.RARE]: [ TrainerType.ARTIST ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.NORMAN, TrainerType.CHEREN ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.BUGSY, TrainerType.BURGH ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.JUAN, TrainerType.CRASHER_WAKE, TrainerType.MARLON ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.MISTY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.MISTY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.JUAN, TrainerType.CRASHER_WAKE, TrainerType.MARLON ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CLAY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CLAY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.PRYCE, TrainerType.CANDICE, TrainerType.BRYCEN ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.WHITNEY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.LT_SURGE, TrainerType.WATTSON, TrainerType.VOLKNER, TrainerType.ELESA ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.BLAINE, TrainerType.FLANNERY ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: [ TrainerType.PSYCHIC ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.MORTY, TrainerType.FANTINA ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CHUCK, TrainerType.BRAWLY ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.SABRINA, TrainerType.TATE, TrainerType.LIZA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: [],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.CLAIR, TrainerType.DRAYDEN ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.GIOVANNI ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.SABRINA ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CHUCK ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.ERIKA, TrainerType.GARDENIA ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.WHITNEY ],
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
    [BiomePoolTier.COMMON]: [ TrainerType.BAKER, TrainerType.OFFICER ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ TrainerType.JANINE ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CANDICE ],
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
    [BiomePoolTier.BOSS]: [ TrainerType.CANDICE ],
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

{
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
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.METAPOD, Type.BUG, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BUTTERFREE, Type.BUG, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WEEDLE, Type.BUG, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KAKUNA, Type.BUG, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BEEDRILL, Type.BUG, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ARBOK, Type.POISON, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ],
        [ Biome.SWAMP, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.NIDORINA, Type.POISON, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.NIDOQUEEN, Type.POISON, Type.GROUND, [
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.NIDORAN_M, Type.POISON, -1, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.NIDORINO, Type.POISON, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.NIDOKING, Type.POISON, Type.GROUND, [
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
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
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GOLBAT, Type.POISON, Type.FLYING, [
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ODDISH, Type.GRASS, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GLOOM, Type.GRASS, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VILEPLUME, Type.GRASS, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PARAS, Type.BUG, Type.GRASS, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PARASECT, Type.BUG, Type.GRASS, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.VENONAT, Type.BUG, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VENOMOTH, Type.BUG, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PERSIAN, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.DOJO, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PRIMEAPE, Type.FIGHTING, -1, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WEEPINBELL, Type.GRASS, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VICTREEBEL, Type.GRASS, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.VOLCANO, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.RAPIDASH, Type.FIRE, -1, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.VOLCANO, BiomePoolTier.COMMON ],
        [ Biome.VOLCANO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SLOWPOKE, Type.WATER, Type.PSYCHIC, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SLOWBRO, Type.WATER, Type.PSYCHIC, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
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
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.DODRIO, Type.NORMAL, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.BEACH, BiomePoolTier.COMMON ],
        [ Biome.SEABED, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.CLOYSTER, Type.WATER, Type.ICE, [
        [ Biome.BEACH, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.EXEGGUTOR, Type.GRASS, Type.PSYCHIC, [
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CUBONE, Type.GROUND, -1, [
        [ Biome.BADLANDS, BiomePoolTier.COMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
        [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MAROWAK, Type.GROUND, -1, [
        [ Biome.BADLANDS, BiomePoolTier.COMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
        [ Biome.TEMPLE, BiomePoolTier.UNCOMMON ],
        [ Biome.BADLANDS, BiomePoolTier.BOSS ]
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
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.BADLANDS, BiomePoolTier.COMMON ],
        [ Biome.CONSTRUCTION_SITE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.RHYDON, Type.GROUND, Type.ROCK, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
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
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.KANGASKHAN, Type.NORMAL, -1, [
        [ Biome.JUNGLE, BiomePoolTier.SUPER_RARE ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.HORSEA, Type.WATER, -1, [
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SEADRA, Type.WATER, -1, [
        [ Biome.SEA, BiomePoolTier.COMMON ]
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
        [ Biome.BEACH, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.STARMIE, Type.WATER, Type.PSYCHIC, [
        [ Biome.BEACH, BiomePoolTier.COMMON ],
        [ Biome.BEACH, BiomePoolTier.BOSS ],
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MR_MIME, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.RUINS, BiomePoolTier.RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.SCYTHER, Type.BUG, Type.FLYING, [
        [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
        [ Biome.FOREST, BiomePoolTier.RARE ],
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
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GYARADOS, Type.WATER, Type.FLYING, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
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
        [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.FURRET, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.HOOTHOOT, Type.NORMAL, Type.FLYING, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.NOCTOWL, Type.NORMAL, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.LEDYBA, Type.BUG, Type.FLYING, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LEDIAN, Type.BUG, Type.FLYING, [
        [ Biome.MEADOW, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SPINARAK, Type.BUG, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ARIADOS, Type.BUG, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CROBAT, Type.POISON, Type.FLYING, [
        [ Biome.CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CHINCHOU, Type.WATER, Type.ELECTRIC, [
        [ Biome.SEABED, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LANTURN, Type.WATER, Type.ELECTRIC, [
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
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.MARILL, Type.WATER, Type.FAIRY, [
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.AZUMARILL, Type.WATER, Type.FAIRY, [
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ],
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SKIPLOOM, Type.GRASS, Type.FLYING, [
        [ Biome.GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.JUMPLUFF, Type.GRASS, Type.FLYING, [
        [ Biome.GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.AIPOM, Type.NORMAL, -1, [
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SUNKERN, Type.GRASS, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SUNFLORA, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.YANMA, Type.BUG, Type.FLYING, [
        [ Biome.JUNGLE, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.WOOPER, Type.WATER, Type.GROUND, [
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.QUAGSIRE, Type.WATER, Type.GROUND, [
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ],
        [ Biome.SWAMP, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ESPEON, Type.PSYCHIC, -1, [
        [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.UMBREON, Type.DARK, -1, [
        [ Biome.ABYSS, BiomePoolTier.SUPER_RARE ],
        [ Biome.ABYSS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.MURKROW, Type.DARK, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.RARE ],
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.FORRETRESS, Type.BUG, Type.STEEL, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.GRANBULL, Type.FAIRY, -1, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
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
        [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TEDDIURSA, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.URSARING, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.BOSS ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
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
        [ Biome.ABYSS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.HOUNDOOM, Type.DARK, Type.FIRE, [
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
        [ Biome.BADLANDS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DONPHAN, Type.GROUND, -1, [
        [ Biome.BADLANDS, BiomePoolTier.COMMON ],
        [ Biome.BADLANDS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PORYGON2, Type.NORMAL, -1, [
        [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
        [ Biome.SPACE, BiomePoolTier.SUPER_RARE ],
        [ Biome.LABORATORY, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.STANTLER, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.UNCOMMON ]
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
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PUPITAR, Type.ROCK, Type.GROUND, [
        [ Biome.MOUNTAIN, BiomePoolTier.SUPER_RARE ],
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TYRANITAR, Type.ROCK, Type.DARK, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MIGHTYENA, Type.DARK, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BEAUTIFLY, Type.BUG, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CASCOON, Type.BUG, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DUSTOX, Type.BUG, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.LOTAD, Type.WATER, Type.GRASS, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LOMBRE, Type.WATER, Type.GRASS, [
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.SWAMP, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LUDICOLO, Type.WATER, Type.GRASS, [
        [ Biome.SWAMP, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SEEDOT, Type.GRASS, -1, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.NUZLEAF, Type.GRASS, Type.DARK, [
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SHIFTRY, Type.GRASS, Type.DARK, [
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.TAILLOW, Type.NORMAL, Type.FLYING, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SWELLOW, Type.NORMAL, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.WINGULL, Type.WATER, Type.FLYING, [
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PELIPPER, Type.WATER, Type.FLYING, [
        [ Biome.SEA, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BRELOOM, Type.GRASS, Type.FIGHTING, [
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.DELCATTY, Type.NORMAL, -1, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
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
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.LAIRON, Type.STEEL, Type.ROCK, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.AGGRON, Type.STEEL, Type.ROCK, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
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
        [ Biome.MEADOW, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.ILLUMISE, Type.BUG, -1, [
        [ Biome.MEADOW, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.ROSELIA, Type.GRASS, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
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
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SHARPEDO, Type.WATER, Type.DARK, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VIBRAVA, Type.GROUND, Type.DRAGON, [
        [ Biome.DESERT, BiomePoolTier.RARE ],
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.FLYGON, Type.GROUND, Type.DRAGON, [
        [ Biome.DESERT, BiomePoolTier.RARE ],
        [ Biome.WASTELAND, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ],
      ]
    ],
    [ Species.CACNEA, Type.GRASS, -1, [
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CACTURNE, Type.GRASS, Type.DARK, [
        [ Biome.DESERT, BiomePoolTier.COMMON ],
        [ Biome.DESERT, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SWABLU, Type.NORMAL, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.ALTARIA, Type.DRAGON, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ],
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
        [ Biome.SPACE, BiomePoolTier.COMMON ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SOLROCK, Type.ROCK, Type.PSYCHIC, [
        [ Biome.SPACE, BiomePoolTier.COMMON ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
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
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SHELGON, Type.DRAGON, -1, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SALAMENCE, Type.DRAGON, Type.FLYING, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ]
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
    [ Species.DEOXYS, Type.PSYCHIC, -1, [
      ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.STARAVIA, Type.NORMAL, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.STARAPTOR, Type.NORMAL, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KRICKETUNE, Type.BUG, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SHINX, Type.ELECTRIC, -1, [
        [ Biome.PLAINS, BiomePoolTier.RARE ],
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LUXIO, Type.ELECTRIC, -1, [
        [ Biome.PLAINS, BiomePoolTier.RARE ],
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LUXRAY, Type.ELECTRIC, -1, [
        [ Biome.PLAINS, BiomePoolTier.RARE ],
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BUDEW, Type.GRASS, Type.POISON, [ ]
    ],
    [ Species.ROSERADE, Type.GRASS, Type.POISON, [
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.COMBEE, Type.BUG, Type.FLYING, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.VESPIQUEN, Type.BUG, Type.FLYING, [
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CHERRIM, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.SLUM, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SKUNTANK, Type.POISON, Type.DARK, [
        [ Biome.SLUM, BiomePoolTier.UNCOMMON ],
        [ Biome.SLUM, BiomePoolTier.BOSS ]
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
    [ Species.HAPPINY, Type.NORMAL, -1, []
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
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.HIPPOWDON, Type.GROUND, -1, [
        [ Biome.DESERT, BiomePoolTier.COMMON ],
        [ Biome.DESERT, BiomePoolTier.BOSS ]
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
        [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
        [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TOXICROAK, Type.POISON, Type.FIGHTING, [
        [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
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
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LUMINEON, Type.WATER, -1, [
        [ Biome.SEA, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.LABORATORY, BiomePoolTier.ULTRA_RARE ],
        [ Biome.LABORATORY, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
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
    [ Species.SHAYMIN, Type.GRASS, -1, [ ]
    ],
    [ Species.ARCEUS, Type.NORMAL, -1, [
      ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
        [ Biome.SLUM, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WATCHOG, Type.NORMAL, -1, [
        [ Biome.METROPOLIS, BiomePoolTier.COMMON ],
        [ Biome.SLUM, BiomePoolTier.COMMON ],
        [ Biome.SLUM, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LIEPARD, Type.DARK, -1, [
        [ Biome.ABYSS, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TRANQUILL, Type.NORMAL, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.UNFEZANT, Type.NORMAL, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
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
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BOLDORE, Type.ROCK, -1, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
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
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SWADLOON, Type.BUG, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LEAVANNY, Type.BUG, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.VENIPEDE, Type.BUG, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WHIRLIPEDE, Type.BUG, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SCOLIPEDE, Type.BUG, Type.POISON, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.COTTONEE, Type.GRASS, Type.FAIRY, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WHIMSICOTT, Type.GRASS, Type.FAIRY, [
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.COMMON ],
        [ Biome.GRASS, BiomePoolTier.BOSS ],
      ]
    ],
    [ Species.PETILIL, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LILLIGANT, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BASCULIN, Type.WATER, -1, [
        [ Biome.SEABED, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SANDILE, Type.GROUND, Type.DARK, [
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KROKOROK, Type.GROUND, Type.DARK, [
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KROOKODILE, Type.GROUND, Type.DARK, [
        [ Biome.DESERT, BiomePoolTier.COMMON ],
        [ Biome.DESERT, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CINCCINO, Type.NORMAL, -1, [
        [ Biome.MEADOW, BiomePoolTier.BOSS ],
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
        [ Biome.LAKE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SWANNA, Type.WATER, Type.FLYING, [
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SAWSBUCK, Type.NORMAL, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.AMOONGUSS, Type.GRASS, Type.POISON, [
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.COMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.RUFFLET, Type.NORMAL, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.BRAVIARY, Type.NORMAL, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.VULLABY, Type.DARK, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.MANDIBUZZ, Type.DARK, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
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
        [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ABYSS, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.ZWEILOUS, Type.DARK, Type.DRAGON, [
        [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ABYSS, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.HYDREIGON, Type.DARK, Type.DRAGON, [
        [ Biome.WASTELAND, BiomePoolTier.UNCOMMON ],
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
        [ Biome.JUNGLE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.FLETCHINDER, Type.FIRE, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TALONFLAME, Type.FIRE, Type.FLYING, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SCATTERBUG, Type.BUG, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SPEWPA, Type.BUG, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VIVILLON, Type.BUG, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LITLEO, Type.FIRE, -1, [
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.PYROAR, Type.FIRE, -1, [
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
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.PANGORO, Type.FIGHTING, Type.DARK, [
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.FURFROU, Type.NORMAL, -1, [
        [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ],
        [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ESPURR, Type.PSYCHIC, -1, [
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MEOWSTIC, Type.PSYCHIC, -1, [
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MALAMAR, Type.DARK, Type.PSYCHIC, [
        [ Biome.SEA, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
    [ Species.HELIOPTILE, Type.ELECTRIC, -1, [
        [ Biome.DESERT, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.HELIOLISK, Type.ELECTRIC, -1, [
        [ Biome.DESERT, BiomePoolTier.BOSS ]
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
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SLIGGOO, Type.DRAGON, -1, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GOODRA, Type.DRAGON, -1, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GUMSHOOS, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CUTIEFLY, Type.BUG, Type.FAIRY, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.RIBOMBEE, Type.BUG, Type.FAIRY, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ROCKRUFF, Type.ROCK, -1, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.LYCANROC, Type.ROCK, -1, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ],
        [ Biome.CAVE, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.WISHIWASHI, Type.WATER, -1, [
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.MAREANIE, Type.POISON, Type.WATER, [
        [ Biome.SWAMP, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TOXAPEX, Type.POISON, Type.WATER, [
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
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.ARAQUANID, Type.WATER, Type.BUG, [
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.FOMANTIS, Type.GRASS, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LURANTIS, Type.GRASS, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
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
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.STEENEE, Type.GRASS, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TSAREENA, Type.GRASS, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.COMFEY, Type.FAIRY, -1, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.UNCOMMON ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ORANGURU, Type.NORMAL, Type.PSYCHIC, [
        [ Biome.JUNGLE, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.PASSIMIAN, Type.FIGHTING, -1, [
        [ Biome.JUNGLE, BiomePoolTier.RARE ]
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
        [ Biome.JUNGLE, BiomePoolTier.UNCOMMON ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
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
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.HAKAMO_O, Type.DRAGON, Type.FIGHTING, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KOMMO_O, Type.DRAGON, Type.FIGHTING, [
        [ Biome.WASTELAND, BiomePoolTier.COMMON ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.TAPU_KOKO, Type.ELECTRIC, Type.FAIRY, [
        [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.TAPU_LELE, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.TAPU_BULU, Type.GRASS, Type.FAIRY, [
        [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.TAPU_FINI, Type.WATER, Type.FAIRY, [
        [ Biome.TEMPLE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.TEMPLE, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
    ],
    [ Species.LUNALA, Type.PSYCHIC, Type.GHOST, [
        [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ]
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
        [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
        [ Biome.ABYSS, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.ISLAND, BiomePoolTier.ULTRA_RARE ],
        [ Biome.ISLAND, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GREEDENT, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ROOKIDEE, Type.FLYING, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CORVISQUIRE, Type.FLYING, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CORVIKNIGHT, Type.FLYING, Type.STEEL, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.COMMON ],
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BLIPBUG, Type.BUG, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DOTTLER, Type.BUG, Type.PSYCHIC, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.ORBEETLE, Type.BUG, Type.PSYCHIC, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.SLUM, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BOLTUND, Type.ELECTRIC, -1, [
        [ Biome.SLUM, BiomePoolTier.COMMON ],
        [ Biome.SLUM, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
    [ Species.TOXEL, Type.ELECTRIC, Type.POISON, [
        [ Biome.SLUM, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.TOXTRICITY, Type.ELECTRIC, Type.POISON, [
        [ Biome.SLUM, BiomePoolTier.RARE ],
        [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.SIZZLIPEDE, Type.FIRE, Type.BUG, [
        [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.CENTISKORCH, Type.FIRE, Type.BUG, [
        [ Biome.BADLANDS, BiomePoolTier.UNCOMMON ],
        [ Biome.BADLANDS, BiomePoolTier.BOSS ]
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
    [ Species.OBSTAGOON, Type.DARK, -1, [
        [ Biome.SLUM, BiomePoolTier.RARE ],
        [ Biome.SLUM, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.PERRSERKER, Type.STEEL, -1, [
        [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ],
        [ Biome.CONSTRUCTION_SITE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.CURSOLA, Type.GHOST, -1, [
        [ Biome.SEABED, BiomePoolTier.SUPER_RARE ],
        [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.SIRFETCHD, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.MR_RIME, Type.ICE, Type.PSYCHIC, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.RUNERIGUS, Type.GROUND, Type.GHOST, [
        [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.FROSMOTH, Type.ICE, Type.BUG, [
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.COMMON ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
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
    [ Species.INDEEDEE, Type.PSYCHIC, -1, [
        [ Biome.METROPOLIS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MORPEKO, Type.ELECTRIC, Type.DARK, [
        [ Biome.METROPOLIS, BiomePoolTier.RARE ]
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
        [ Biome.WASTELAND, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.DRAKLOAK, Type.DRAGON, Type.GHOST, [
        [ Biome.WASTELAND, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.DRAGAPULT, Type.DRAGON, Type.GHOST, [
        [ Biome.WASTELAND, BiomePoolTier.RARE ],
        [ Biome.WASTELAND, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
    ],
    [ Species.WYRDEER, Type.NORMAL, Type.PSYCHIC, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.OVERQWIL, Type.DARK, Type.POISON, [
        [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.ENAMORUS, Type.FAIRY, Type.FLYING, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.SPRIGATITO, Type.GRASS, -1, [
      ]
    ],
    [ Species.FLORAGATO, Type.GRASS, -1, [
      ]
    ],
    [ Species.MEOWSCARADA, Type.GRASS, Type.DARK, [
      ]
    ],
    [ Species.FUECOCO, Type.FIRE, -1, [
      ]
    ],
    [ Species.CROCALOR, Type.FIRE, -1, [
      ]
    ],
    [ Species.SKELEDIRGE, Type.FIRE, Type.GHOST, [
      ]
    ],
    [ Species.QUAXLY, Type.WATER, -1, [
      ]
    ],
    [ Species.QUAXWELL, Type.WATER, -1, [
      ]
    ],
    [ Species.QUAQUAVAL, Type.WATER, Type.FIGHTING, [
      ]
    ],
    [ Species.LECHONK, Type.NORMAL, -1, [
      ]
    ],
    [ Species.OINKOLOGNE, Type.NORMAL, -1, [
      ]
    ],
    [ Species.TAROUNTULA, Type.BUG, -1, [
      ]
    ],
    [ Species.SPIDOPS, Type.BUG, -1, [
      ]
    ],
    [ Species.NYMBLE, Type.BUG, -1, [
      ]
    ],
    [ Species.LOKIX, Type.BUG, Type.DARK, [
      ]
    ],
    [ Species.PAWMI, Type.ELECTRIC, -1, [
      ]
    ],
    [ Species.PAWMO, Type.ELECTRIC, Type.FIGHTING, [
      ]
    ],
    [ Species.PAWMOT, Type.ELECTRIC, Type.FIGHTING, [
      ]
    ],
    [ Species.TANDEMAUS, Type.NORMAL, -1, [
      ]
    ],
    [ Species.MAUSHOLD, Type.NORMAL, -1, [
      ]
    ],
    [ Species.FIDOUGH, Type.FAIRY, -1, [
      ]
    ],
    [ Species.DACHSBUN, Type.FAIRY, -1, [
      ]
    ],
    [ Species.SMOLIV, Type.GRASS, -1, [
      ]
    ],
    [ Species.DOLLIV, Type.GRASS, -1, [
      ]
    ],
    [ Species.ARBOLIVA, Type.GRASS, -1, [
      ]
    ],
    [ Species.SQUAWKABILLY, Type.NORMAL, Type.FLYING, [
      ]
    ],
    [ Species.NACLI, Type.ROCK, -1, [
      ]
    ],
    [ Species.NACLSTACK, Type.ROCK, -1, [
      ]
    ],
    [ Species.GARGANACL, Type.ROCK, -1, [
      ]
    ],
    [ Species.CHARCADET, Type.FIRE, -1, [
      ]
    ],
    [ Species.ARMAROUGE, Type.FIRE, Type.PSYCHIC, [
      ]
    ],
    [ Species.CERULEDGE, Type.FIRE, Type.GHOST, [
      ]
    ],
    [ Species.TADBULB, Type.ELECTRIC, -1, [
      ]
    ],
    [ Species.BELLIBOLT, Type.ELECTRIC, -1, [
      ]
    ],
    [ Species.WATTREL, Type.ELECTRIC, Type.FLYING, [
      ]
    ],
    [ Species.KILOWATTREL, Type.ELECTRIC, Type.FLYING, [
      ]
    ],
    [ Species.MASCHIFF, Type.DARK, -1, [
      ]
    ],
    [ Species.MABOSSTIFF, Type.DARK, -1, [
      ]
    ],
    [ Species.SHROODLE, Type.POISON, -1, [
      ]
    ],
    [ Species.GRAFAIAI, Type.POISON, -1, [
      ]
    ],
    [ Species.BRAMBLIN, Type.GRASS, Type.GHOST, [
      ]
    ],
    [ Species.BRAMBLEGHAST, Type.GRASS, Type.GHOST, [
      ]
    ],
    [ Species.TOEDSCOOL, Type.GROUND, Type.GRASS, [
      ]
    ],
    [ Species.TOEDSCRUEL, Type.GROUND, Type.GRASS, [
      ]
    ],
    [ Species.KLAWF, Type.ROCK, -1, [
      ]
    ],
    [ Species.CAPSAKID, Type.GRASS, -1, [
      ]
    ],
    [ Species.SCOVILLAIN, Type.GRASS, Type.FIRE, [
      ]
    ],
    [ Species.RELLOR, Type.BUG, -1, [
      ]
    ],
    [ Species.RABSCA, Type.BUG, Type.PSYCHIC, [
      ]
    ],
    [ Species.FLITTLE, Type.PSYCHIC, -1, [
      ]
    ],
    [ Species.ESPATHRA, Type.PSYCHIC, -1, [
      ]
    ],
    [ Species.TINKATINK, Type.FAIRY, Type.STEEL, [
      ]
    ],
    [ Species.TINKATUFF, Type.FAIRY, Type.STEEL, [
      ]
    ],
    [ Species.TINKATON, Type.FAIRY, Type.STEEL, [
      ]
    ],
    [ Species.WIGLETT, Type.WATER, -1, [
      ]
    ],
    [ Species.WUGTRIO, Type.WATER, -1, [
      ]
    ],
    [ Species.BOMBIRDIER, Type.FLYING, Type.DARK, [
      ]
    ],
    [ Species.FINIZEN, Type.WATER, -1, [
      ]
    ],
    [ Species.PALAFIN, Type.WATER, -1, [
      ]
    ],
    [ Species.VAROOM, Type.STEEL, Type.POISON, [
      ]
    ],
    [ Species.REVAVROOM, Type.STEEL, Type.POISON, [
      ]
    ],
    [ Species.CYCLIZAR, Type.DRAGON, -1, [
      ]
    ],
    [ Species.ORTHWORM, Type.STEEL, -1, [
      ]
    ],
    [ Species.GLIMMET, Type.ROCK, Type.POISON, [
      ]
    ],
    [ Species.GLIMMORA, Type.ROCK, Type.POISON, [
      ]
    ],
    [ Species.GREAVARD, Type.GHOST, -1, [
      ]
    ],
    [ Species.HOUNDSTONE, Type.GHOST, -1, [
      ]
    ],
    [ Species.FLAMIGO, Type.FLYING, Type.FIGHTING, [
      ]
    ],
    [ Species.CETODDLE, Type.ICE, -1, [
      ]
    ],
    [ Species.CETITAN, Type.ICE, -1, [
      ]
    ],
    [ Species.VELUZA, Type.WATER, Type.PSYCHIC, [
      ]
    ],
    [ Species.DONDOZO, Type.WATER, -1, [
      ]
    ],
    [ Species.TATSUGIRI, Type.DRAGON, Type.WATER, [
      ]
    ],
    [ Species.ANNIHILAPE, Type.FIGHTING, Type.GHOST, [
        [ Biome.PLAINS, BiomePoolTier.UNCOMMON ],
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.DOJO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CLODSIRE, Type.POISON, Type.GROUND, [
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
      ]
    ],
    [ Species.ARCTIBAX, Type.DRAGON, Type.ICE, [
      ]
    ],
    [ Species.BAXCALIBUR, Type.DRAGON, Type.ICE, [
      ]
    ],
    [ Species.GIMMIGHOUL, Type.GHOST, -1, [
      ]
    ],
    [ Species.GHOLDENGO, Type.STEEL, Type.GHOST, [
      ]
    ],
    [ Species.WO_CHIEN, Type.DARK, Type.GRASS, [
      ]
    ],
    [ Species.CHIEN_PAO, Type.DARK, Type.ICE, [
      ]
    ],
    [ Species.TING_LU, Type.DARK, Type.GROUND, [
      ]
    ],
    [ Species.CHI_YU, Type.DARK, Type.FIRE, [
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
      ]
    ],
    [ Species.MIRAIDON, Type.ELECTRIC, Type.DRAGON, [
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
      ]
    ],
    [ Species.SINISTCHA, Type.GRASS, Type.GHOST, [
      ]
    ],
    [ Species.OKIDOGI, Type.POISON, Type.FIGHTING, [
      ]
    ],
    [ Species.MUNKIDORI, Type.POISON, Type.PSYCHIC, [
      ]
    ],
    [ Species.FEZANDIPITI, Type.POISON, Type.FAIRY, [
      ]
    ],
    [ Species.OGERPON, Type.GRASS, -1, [
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
      ]
    ],
    [ Species.RAGING_BOLT, Type.ELECTRIC, Type.DRAGON, [
      ]
    ],
    [ Species.IRON_BOULDER, Type.ROCK, Type.PSYCHIC, [
      ]
    ],
    [ Species.IRON_CROWN, Type.STEEL, Type.PSYCHIC, [
      ]
    ],
    [ Species.TERAPAGOS, Type.NORMAL, -1, [
      ]
    ],
    [ Species.PECHARUNT, Type.POISON, Type.GHOST, [
      ]
    ],
    [ Species.ALOLA_RATTATA, Type.DARK, -1, [
        [ Biome.ISLAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ALOLA_RATICATE, Type.DARK, -1, [
        [ Biome.ISLAND, BiomePoolTier.COMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ALOLA_RAICHU, Type.ELECTRIC, Type.PSYCHIC, [
        [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
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
        [ Biome.ISLAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ALOLA_PERSIAN, Type.DARK, -1, [
        [ Biome.ISLAND, BiomePoolTier.COMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
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
        [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ALOLA_MAROWAK, Type.FIRE, Type.GHOST, [
        [ Biome.ISLAND, BiomePoolTier.UNCOMMON ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.GALAR_MEOWTH, Type.STEEL, -1, [
        [ Biome.CONSTRUCTION_SITE, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_PONYTA, Type.PSYCHIC, -1, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_RAPIDASH, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.FAIRY_CAVE, BiomePoolTier.SUPER_RARE ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_SLOWPOKE, Type.PSYCHIC, -1, [
        [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_SLOWBRO, Type.POISON, Type.PSYCHIC, [
        [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
        [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_FARFETCHD, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_WEEZING, Type.POISON, Type.FAIRY, [
        [ Biome.SLUM, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_CORSOLA, Type.GHOST, -1, [
        [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_ZIGZAGOON, Type.DARK, -1, [
        [ Biome.SLUM, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.GALAR_LINOONE, Type.DARK, -1, [
        [ Biome.SLUM, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.GALAR_DARUMAKA, Type.ICE, -1, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.GALAR_DARMANITAN, Type.ICE, -1, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_YAMASK, Type.GROUND, Type.GHOST, [
        [ Biome.RUINS, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.GALAR_STUNFISK, Type.GROUND, Type.STEEL, [
        [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
        [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_GROWLITHE, Type.FIRE, Type.ROCK, [
        [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_ARCANINE, Type.FIRE, Type.ROCK, [
        [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_VOLTORB, Type.ELECTRIC, Type.GRASS, [
        [ Biome.POWER_PLANT, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.HISUI_ELECTRODE, Type.ELECTRIC, Type.GRASS, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.HISUI_TYPHLOSION, Type.FIRE, Type.GHOST, [
        [ Biome.VOLCANO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_QWILFISH, Type.DARK, Type.POISON, [
        [ Biome.SEABED, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_SNEASEL, Type.FIGHTING, Type.POISON, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_SAMUROTT, Type.WATER, Type.DARK, [
        [ Biome.LAKE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_LILLIGANT, Type.GRASS, Type.FIGHTING, [
        [ Biome.MEADOW, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_ZORUA, Type.NORMAL, Type.GHOST, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_ZOROARK, Type.NORMAL, Type.GHOST, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.SUPER_RARE ],
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_BRAVIARY, Type.PSYCHIC, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.HISUI_SLIGGOO, Type.STEEL, Type.DRAGON, [
        [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_GOODRA, Type.STEEL, Type.DRAGON, [
        [ Biome.SWAMP, BiomePoolTier.SUPER_RARE ],
        [ Biome.SWAMP, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.HISUI_AVALUGG, Type.ICE, Type.ROCK, [
        [ Biome.SNOWY_FOREST, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.HISUI_DECIDUEYE, Type.GRASS, Type.FIGHTING, [
        [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.PALDEA_TAUROS, Type.FIGHTING, -1, [
      ]
    ],
    [ Species.PALDEA_WOOPER, Type.POISON, Type.GROUND, [
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
        [ Biome.SLUM, BiomePoolTier.COMMON ]
      ]
    ],
    [ TrainerType.BEAUTY, [
      [ Biome.FAIRY_CAVE, BiomePoolTier.COMMON ]
    ] ],
    [ TrainerType.BIKER, [] ],
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
    [ TrainerType.NURSE, [] ],
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
    [ TrainerType.ROUGHNECK, [] ],
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
    [ TrainerType.STUDENT, [] ],
    [ TrainerType.SWIMMER, [
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ TrainerType.TWINS, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ TrainerType.VETERAN, [] ],
    [ TrainerType.WAITER, [] ],
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
        [ Biome.LAKE, BiomePoolTier.BOSS ],
        [ Biome.BEACH, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.LT_SURGE, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.ERIKA, [
        [ Biome.GRASS, BiomePoolTier.BOSS ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.JANINE, [
      [ Biome.SWAMP, BiomePoolTier.BOSS ],
      [ Biome.SLUM, BiomePoolTier.BOSS ]
    ]
    ],
    [ TrainerType.SABRINA, [
        [ Biome.RUINS, BiomePoolTier.BOSS ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.GIOVANNI, [
        [ Biome.ABYSS, BiomePoolTier.BOSS ],
        [ Biome.LABORATORY, BiomePoolTier.BOSS ] // Temporary
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
        [ Biome.MEADOW, BiomePoolTier.BOSS ],
        [ Biome.FAIRY_CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.MORTY, [
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.CHUCK, [
        [ Biome.DOJO, BiomePoolTier.BOSS ],
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
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.BOSS ],
        [ Biome.SEABED, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.ROARK, [
        [ Biome.CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.GARDENIA, [
        [ Biome.GRASS, BiomePoolTier.BOSS ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
        [ Biome.JUNGLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.CRASHER_WAKE, [
        [ Biome.SEA, BiomePoolTier.BOSS ],
        [ Biome.SEABED, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.FANTINA, [
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ],
        [ Biome.TEMPLE, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.BYRON, [
        [ Biome.FACTORY, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.CANDICE, [
        [ Biome.ICE_CAVE, BiomePoolTier.BOSS ],
        [ Biome.ISLAND, BiomePoolTier.BOSS ], // Temporary
        [ Biome.SNOWY_FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.VOLKNER, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.CILAN, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ] ],
    [ TrainerType.CHILI, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ] ],
    [ TrainerType.CRESS, [
      [ Biome.PLAINS, BiomePoolTier.BOSS ]
    ] ],
    [ TrainerType.CHEREN, [
        [ Biome.PLAINS, BiomePoolTier.BOSS ],
        [ Biome.METROPOLIS, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.LENORA, [
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.BADLANDS, BiomePoolTier.BOSS ],
        [ Biome.DESERT, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.BOSS ],
        [ Biome.SEABED, BiomePoolTier.BOSS ]
      ]
    ],
    [ TrainerType.SHAUNTAL, [] ],
    [ TrainerType.MARSHAL, [] ],
    [ TrainerType.GRIMSLEY, [] ],
    [ TrainerType.CAITLIN, [] ],
    [ TrainerType.BLUE, [] ],
    [ TrainerType.RED, [] ],
    [ TrainerType.LANCE, [] ],
    [ TrainerType.STEVEN, [] ],
    [ TrainerType.WALLACE, [] ],
    [ TrainerType.CYNTHIA, [] ],
    [ TrainerType.ALDER, [] ],
    [ TrainerType.IRIS, [] ],
    [ TrainerType.RIVAL, [] ]
  ];

  biomeDepths[Biome.TOWN] = [ 0, 1 ];

  const traverseBiome = (biome: Biome, depth: integer) => {
    const linkedBiomes: (Biome | [ Biome, integer ])[] = Array.isArray(biomeLinks[biome])
      ? biomeLinks[biome] as (Biome | [ Biome, integer ])[]
      : [ biomeLinks[biome] as Biome ];
    for (let linkedBiomeEntry of linkedBiomes) {
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

  for (let biome of Utils.getEnumValues(Biome)) {
    biomePokemonPools[biome] = {};
    biomeTrainerPools[biome] = {};

    for (let tier of Utils.getEnumValues(BiomePoolTier)) {
      biomePokemonPools[biome][tier] = [];
      biomeTrainerPools[biome][tier] = [];
    }
  }

  for (let pb of pokemonBiomes) {
    const speciesId = pb[0] as Species;
    const biomeEntries = pb[3] as (Biome | BiomePoolTier)[][];

    const speciesEvolutions: SpeciesEvolution[] = pokemonEvolutions.hasOwnProperty(speciesId)
      ? pokemonEvolutions[speciesId]
      : [];

    if (!biomeEntries.filter(b => b[0] !== Biome.END).length && !speciesEvolutions.filter(es => !!(pokemonBiomes.find(p => p[0] === es.speciesId))[3].filter(b => b[0] !== Biome.END).length).length)
      uncatchableSpecies.push(speciesId);

    for (let b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];

      if (!biomePokemonPools.hasOwnProperty(biome) || !biomePokemonPools[biome].hasOwnProperty(tier))
        continue;

      const biomeTierPool = biomePokemonPools[biome][tier];

      let treeIndex = -1;
      let arrayIndex = 0;

      // Not sure why this works but let's just leave it alone until we need it again

      for (let t = 0; t < biomeTierPool.length; t++) {
        const existingSpeciesIds = biomeTierPool[t] as SpeciesTree;
        for (let es = 0; es < existingSpeciesIds.length; es++) {
          const existingSpeciesId = existingSpeciesIds[es];
          if (pokemonEvolutions.hasOwnProperty(existingSpeciesId) && (pokemonEvolutions[existingSpeciesId] as SpeciesEvolution[]).find(ese => ese.speciesId === speciesId)) {
            treeIndex = t;
            arrayIndex = es + 1;
            break;
          } else if (speciesEvolutions && speciesEvolutions.find(se => se.speciesId === existingSpeciesId)) {
            treeIndex = t;
            arrayIndex = es;
            break;
          }
        }
        if (treeIndex > -1)
          break;
      }

      if (treeIndex > -1)
        biomeTierPool[treeIndex].splice(arrayIndex, 0, speciesId);
      else
        biomeTierPool.push([ speciesId ]);
    }
  }

  for (let b of Object.keys(biomePokemonPools)) {
    for (let t of Object.keys(biomePokemonPools[b])) {
      const tier = parseInt(t) as BiomePoolTier;
      const biomeTierPool = biomePokemonPools[b][t];
      for (let e = 0; e < biomeTierPool.length; e++) {
        const entry = biomeTierPool[e];
        if (entry.length === 1)
          biomeTierPool[e] = entry[0];
        else {
          const newEntry = {
            1: [ entry[0] ]
          };
          for (let s = 1; s < entry.length; s++) {
            const speciesId = entry[s];
            const prevolution = entry.map(s => pokemonEvolutions[s]).flat().find(e => e && e.speciesId === speciesId);
            const level = prevolution.level - (prevolution.level === 1 ? 1 : 0) + (prevolution.wildDelay * 10) - (tier >= BiomePoolTier.BOSS ? 10 : 0);
            if (!newEntry.hasOwnProperty(level))
              newEntry[level] = [ speciesId ];
            else
              newEntry[level].push(speciesId);
          }
          biomeTierPool[e] = newEntry;
        }
      }
    }
  }

  for (let tb of trainerBiomes) {
    const trainerType = tb[0] as TrainerType;
    const biomeEntries = tb[1] as BiomePoolTier[][];

    for (let b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];

      if (!biomeTrainerPools.hasOwnProperty(biome) || !biomeTrainerPools[biome].hasOwnProperty(tier))
        continue;

      const biomeTierPool = biomeTrainerPools[biome][tier];
      biomeTierPool.push(trainerType);
    }
  }

  function outputPools() {
    const pokemonOutput = {};
    const trainerOutput = {};

    for (let b of Object.keys(biomePokemonPools)) {
      const biome = Biome[b];
      pokemonOutput[biome] = {};
      trainerOutput[biome] = {};

      for (let t of Object.keys(biomePokemonPools[b])) {
        const tier = BiomePoolTier[t];

        pokemonOutput[biome][tier] = [];

        for (let f of biomePokemonPools[b][t]) {
          if (typeof f === 'number')
            pokemonOutput[biome][tier].push(Species[f]);
          else {
            const tree = {};

            for (let l of Object.keys(f)) {
              tree[l] = f[l].map(s => Species[s]);
            }

            pokemonOutput[biome][tier].push(tree);
          }
        }
      }

      for (let t of Object.keys(biomeTrainerPools[b])) {
        const tier = BiomePoolTier[t];

        trainerOutput[biome][tier] = [];

        for (let f of biomeTrainerPools[b][t])
          trainerOutput[biome][tier].push(TrainerType[f]);
      }
    }

    console.log(beautify(pokemonOutput, null, 2, 180).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, '$1Species.$2').replace(/"(\d+)": /g, '$1: ').replace(/(    )"(.*?)"/g, '$1[BiomePoolTier.$2]').replace(/(  )"(.*?)"/g, '$1[Biome.$2]'));
    console.log(beautify(trainerOutput, null, 2, 120).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, '$1TrainerType.$2').replace(/"(\d+)": /g, '$1: ').replace(/(    )"(.*?)"/g, '$1[BiomePoolTier.$2]').replace(/(  )"(.*?)"/g, '$1[Biome.$2]'));
  }

  //outputPools();

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