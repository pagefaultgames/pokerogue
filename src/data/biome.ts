import { pokemonEvolutions, SpeciesEvolution } from "./pokemon-evolutions";
import { Species } from "./species";
import { Type } from './type';
import * as Utils from '../utils';

import beautify from 'json-beautify';

export enum Biome {
  TOWN,
  PLAINS,
  GRASS,
  TALL_GRASS,
  CITY,
  FOREST,
  SEA,
  SWAMP,
  BEACH,
  LAKE,
  SEABED,
  MOUNTAIN,
  LAND,
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
  END
};

export function getBiomeName(biome: Biome) {
  switch (biome) {
    case Biome.GRASS:
      return 'GRASSY FIELD';
    case Biome.RUINS:
      return 'ANCIENT RUINS';
    case Biome.ABYSS:
      return 'THE ABYSS';
    case Biome.SPACE:
      return 'STRATOSPHERE';
    case Biome.END:
      return 'FINAL DESTINATION';
    default:
      return Biome[biome].replace(/\_/g, ' ');
  }
}

interface BiomeLinks {
  [key: integer]: Biome | Biome[]
}

export const biomeLinks: BiomeLinks = {
  [Biome.TOWN]: Biome.PLAINS,
  [Biome.PLAINS]: [ Biome.GRASS, Biome.CITY, Biome.LAKE ],
  [Biome.GRASS]: Biome.TALL_GRASS,
  [Biome.TALL_GRASS]: [ Biome.FOREST, Biome.CAVE ],
  [Biome.CITY]: [ Biome.DOJO, Biome.POWER_PLANT ],
  [Biome.FOREST]: Biome.MEADOW,
  [Biome.SEA]: [ Biome.SEABED, Biome.ICE_CAVE ],
  [Biome.SWAMP]: [ Biome.GRAVEYARD, Biome.TALL_GRASS ],
  [Biome.BEACH]: Biome.SEA,
  [Biome.LAKE]: [ Biome.BEACH, Biome.SWAMP ],
  [Biome.SEABED]: Biome.CAVE,
  [Biome.MOUNTAIN]: [ Biome.WASTELAND, Biome.VOLCANO ],
  [Biome.LAND]: [ Biome.DESERT, Biome.MOUNTAIN ],
  [Biome.CAVE]: [ Biome.LAND, Biome.BEACH ],
  [Biome.DESERT]: Biome.RUINS,
  [Biome.ICE_CAVE]: Biome.LAKE,
  [Biome.MEADOW]: Biome.PLAINS,
  [Biome.POWER_PLANT]: Biome.FACTORY,
  [Biome.VOLCANO]: Biome.ICE_CAVE,
  [Biome.GRAVEYARD]: Biome.ABYSS,
  [Biome.DOJO]: Biome.PLAINS,
  [Biome.FACTORY]: Biome.PLAINS,
  [Biome.RUINS]: Biome.FOREST,
  [Biome.WASTELAND]: Biome.LAND,
  [Biome.ABYSS]: Biome.SPACE,
  [Biome.SPACE]: Biome.RUINS
};

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

export interface SpeciesTree {
  [key: integer]: Species[]
}

export interface BiomeTierPools {
  [key: integer]: Array<Species | SpeciesTree>
}

export interface BiomePools {
  [key: integer]: BiomeTierPools
}

export const biomePools: BiomePools = {
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
      { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] },
      Species.PIDOVE,
      Species.COTTONEE
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
      Species.PICHU,
      Species.IGGLYBUFF,
      Species.LOTAD,
      Species.SEEDOT,
      { 1: [ Species.SHROOMISH ], 23: [ Species.BRELOOM ] },
      Species.NINCADA,
      Species.WHISMUR,
      Species.AZURILL,
      Species.SKITTY,
      Species.KRICKETOT,
      Species.BUDEW,
      Species.COMBEE,
      { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] },
      Species.VENIPEDE,
      Species.MINCCINO
    ],
    [BiomePoolTier.RARE]: [ Species.ABRA, Species.CLEFFA, { 1: [ Species.SURSKIT ], 22: [ Species.MASQUERAIN ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.EEVEE, Species.TOGEPI, Species.TYROGUE, Species.SMOOCHUM, Species.ELEKID, Species.MAGBY, Species.RALTS, Species.WYNAUT, Species.BONSLY, Species.MIME_JR, Species.HAPPINY, Species.MUNCHLAX, Species.RIOLU ],
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
      { 1: [ Species.BIDOOF ], 15: [ Species.BIBAREL ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] },
      { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] },
      Species.PIKACHU,
      { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ] },
      { 1: [ Species.DODUO ], 31: [ Species.DODRIO ] },
      { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
      { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] }
    ],
    [BiomePoolTier.RARE]: [
      Species.CLEFAIRY,
      { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] },
      { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] },
      { 1: [ Species.BUNEARY ], 20: [ Species.LOPUNNY ] },
      Species.BOUFFALANT
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.FARFETCHD, Species.LICKITUNG, Species.CHANSEY, Species.EEVEE, Species.SNORLAX, Species.DUNSPARCE, Species.AUDINO ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DITTO, Species.LATIAS, Species.LATIOS ],
    [BiomePoolTier.BOSS]: [ Species.PERSIAN, Species.DODRIO, Species.FURRET, Species.MIGHTYENA, Species.LINOONE, Species.BIBAREL, Species.LOPUNNY ],
    [BiomePoolTier.BOSS_RARE]: [ Species.FARFETCHD, Species.SNORLAX, Species.LICKILICKY, Species.AUDINO ],
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
    [BiomePoolTier.RARE]: [
      { 1: [ Species.BULBASAUR ], 16: [ Species.IVYSAUR ], 32: [ Species.VENUSAUR ] },
      Species.GROWLITHE,
      Species.EXEGGCUTE,
      { 1: [ Species.TURTWIG ], 18: [ Species.GROTLE ], 32: [ Species.TORTERRA ] },
      { 1: [ Species.SNIVY ], 17: [ Species.SERVINE ], 36: [ Species.SERPERIOR ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SUDOWOODO ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.JUMPLUFF, Species.SUNFLORA, Species.WHIMSICOTT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.VENUSAUR, Species.SUDOWOODO, Species.TORTERRA, Species.SERPERIOR ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.SHAYMIN ]
  },
  [Biome.TALL_GRASS]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.NIDORAN_F ], 16: [ Species.NIDORINA ] },
      { 1: [ Species.NIDORAN_M ], 16: [ Species.NIDORINO ] },
      { 1: [ Species.ODDISH ], 21: [ Species.GLOOM ] },
      Species.TANGELA,
      { 1: [ Species.NINCADA ], 20: [ Species.NINJASK ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      Species.VULPIX,
      { 1: [ Species.PARAS ], 24: [ Species.PARASECT ] },
      { 1: [ Species.VENONAT ], 31: [ Species.VENOMOTH ] },
      { 1: [ Species.SPINARAK ], 22: [ Species.ARIADOS ] },
      { 1: [ Species.KRICKETOT ], 10: [ Species.KRICKETUNE ] }
    ],
    [BiomePoolTier.RARE]: [ Species.PINSIR, { 1: [ Species.CHIKORITA ], 16: [ Species.BAYLEEF ], 32: [ Species.MEGANIUM ] }, Species.GIRAFARIG, Species.ZANGOOSE, Species.KECLEON, Species.TROPIUS ],
    [BiomePoolTier.SUPER_RARE]: [ Species.KANGASKHAN, Species.SCYTHER, Species.SHEDINJA ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.NIDOQUEEN, Species.NIDOKING, Species.VILEPLUME, Species.NINJASK, Species.ZANGOOSE, Species.KECLEON, Species.TROPIUS, Species.KRICKETUNE, Species.TANGROWTH ],
    [BiomePoolTier.BOSS_RARE]: [ Species.KANGASKHAN, Species.PINSIR, Species.MEGANIUM, Species.BELLOSSOM, Species.GIRAFARIG ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.CITY]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.RATTATA ], 20: [ Species.RATICATE ] },
      Species.GRIMER,
      { 1: [ Species.KOFFING ], 35: [ Species.WEEZING ] },
      { 1: [ Species.STUNKY ], 34: [ Species.SKUNTANK ] },
      { 1: [ Species.PATRAT ], 20: [ Species.WATCHOG ] },
      { 1: [ Species.LILLIPUP ], 16: [ Species.HERDIER ], 32: [ Species.STOUTLAND ] },
      { 1: [ Species.TRUBBISH ], 36: [ Species.GARBODOR ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] } ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [ Species.EEVEE, Species.SMEARGLE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DITTO, Species.CASTFORM ],
    [BiomePoolTier.BOSS]: [ Species.MUK, Species.WEEZING, Species.WORMADAM, Species.SKUNTANK, Species.WATCHOG, Species.STOUTLAND, Species.GARBODOR ],
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
      { 1: [ Species.CHERUBI ], 25: [ Species.CHERRIM ] },
      { 1: [ Species.SEWADDLE ], 20: [ Species.SWADLOON ], 30: [ Species.LEAVANNY ] },
      { 1: [ Species.VENIPEDE ], 22: [ Species.WHIRLIPEDE ], 30: [ Species.SCOLIPEDE ] },
      Species.PETILIL,
      { 1: [ Species.DEERLING ], 34: [ Species.SAWSBUCK ] },
      { 1: [ Species.FOONGUS ], 39: [ Species.AMOONGUSS ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.EKANS ], 22: [ Species.ARBOK ] },
      Species.EXEGGCUTE,
      Species.TANGELA,
      { 1: [ Species.HOOTHOOT ], 20: [ Species.NOCTOWL ] },
      Species.AIPOM,
      { 1: [ Species.TEDDIURSA ], 30: [ Species.URSARING ] },
      Species.ROSELIA,
      Species.TROPIUS,
      { 1: [ Species.BURMY ], 20: [ Species.MOTHIM, Species.WORMADAM ] },
      { 1: [ Species.PANSAGE ], 20: [ Species.SIMISAGE ] },
      { 1: [ Species.JOLTIK ], 36: [ Species.GALVANTULA ] }
    ],
    [BiomePoolTier.RARE]: [
      Species.SCYTHER,
      Species.YANMA,
      Species.HERACROSS,
      Species.STANTLER,
      { 1: [ Species.TREECKO ], 16: [ Species.GROVYLE ], 36: [ Species.SCEPTILE ] },
      { 1: [ Species.SLAKOTH ], 18: [ Species.VIGOROTH ], 36: [ Species.SLAKING ] },
      Species.SEVIPER,
      Species.CARNIVINE,
      Species.KARRABLAST,
      Species.SHELMET
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.CHATOT, Species.DURANT ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.CELEBI ],
    [BiomePoolTier.BOSS]: [
      Species.VENOMOTH,
      Species.VICTREEBEL,
      Species.EXEGGUTOR,
      Species.NOCTOWL,
      Species.ARIADOS,
      Species.FORRETRESS,
      Species.BEAUTIFLY,
      Species.DUSTOX,
      Species.SHIFTRY,
      Species.BRELOOM,
      Species.SEVIPER,
      Species.WORMADAM,
      Species.MOTHIM,
      Species.VESPIQUEN,
      Species.CHERRIM,
      Species.AMBIPOM,
      Species.CARNIVINE,
      Species.YANMEGA,
      Species.SIMISAGE,
      Species.LEAVANNY,
      Species.SCOLIPEDE,
      Species.LILLIGANT,
      Species.SAWSBUCK,
      Species.AMOONGUSS,
      Species.GALVANTULA
    ],
    [BiomePoolTier.BOSS_RARE]: [ Species.SCIZOR, Species.HERACROSS, Species.STANTLER, Species.SCEPTILE, Species.SLAKING, Species.LEAFEON, Species.ESCAVALIER, Species.ACCELGOR, Species.DURANT ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.CELEBI ]
  },
  [Biome.SEA]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] },
      { 1: [ Species.HORSEA ], 32: [ Species.SEADRA ] },
      { 1: [ Species.WINGULL ], 25: [ Species.PELIPPER ] },
      { 1: [ Species.CARVANHA ], 30: [ Species.SHARPEDO ] },
      { 1: [ Species.BUIZEL ], 26: [ Species.FLOATZEL ] },
      { 1: [ Species.FINNEON ], 31: [ Species.LUMINEON ] }
    ],
    [BiomePoolTier.UNCOMMON]: [
      { 1: [ Species.POLIWAG ], 25: [ Species.POLIWHIRL ] },
      { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] },
      Species.SHELLDER,
      { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
      { 1: [ Species.STARYU ], 20: [ Species.STARMIE ] },
      { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] },
      { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] },
      { 1: [ Species.PANPOUR ], 20: [ Species.SIMIPOUR ] },
      { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] }
    ],
    [BiomePoolTier.RARE]: [ Species.LAPRAS, { 1: [ Species.PIPLUP ], 16: [ Species.PRINPLUP ], 36: [ Species.EMPOLEON ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.KINGDRA ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.TENTACRUEL, Species.PELIPPER, Species.SHARPEDO, Species.FLOATZEL, Species.LUMINEON, Species.SIMIPOUR ],
    [BiomePoolTier.BOSS_RARE]: [ Species.KINGDRA, Species.EMPOLEON ],
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
      Species.STUNFISK
    ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.TOTODILE ], 18: [ Species.CROCONAW ], 30: [ Species.FERALIGATR ] }, { 1: [ Species.MUDKIP ], 16: [ Species.MARSHTOMP ], 36: [ Species.SWAMPERT ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.POLITOED ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.AZELF ],
    [BiomePoolTier.BOSS]: [ Species.ARBOK, Species.POLIWRATH, Species.QUAGSIRE, Species.LUDICOLO, Species.SWALOT, Species.WHISCASH, Species.GASTRODON, Species.SEISMITOAD, Species.STUNFISK ],
    [BiomePoolTier.BOSS_RARE]: [ Species.FERALIGATR, Species.POLITOED, Species.SWAMPERT ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.AZELF ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.BEACH]: {
    [BiomePoolTier.COMMON]: [
      Species.SHELLDER,
      { 1: [ Species.KRABBY ], 28: [ Species.KINGLER ] },
      { 1: [ Species.STARYU ], 20: [ Species.STARMIE ] },
      { 1: [ Species.CORPHISH ], 30: [ Species.CRAWDAUNT ] },
      { 1: [ Species.DWEBBLE ], 34: [ Species.CRUSTLE ] },
      { 1: [ Species.TIRTOUGA ], 37: [ Species.CARRACOSTA ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BURMY ], 20: [ Species.WORMADAM ] } ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.KELDEO ],
    [BiomePoolTier.BOSS]: [ Species.CLOYSTER, Species.KINGLER, Species.STARMIE, Species.CRAWDAUNT, Species.WORMADAM, Species.CRUSTLE, Species.CARRACOSTA ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.KELDEO ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.LAKE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.PSYDUCK ], 33: [ Species.GOLDUCK ] },
      { 1: [ Species.SLOWPOKE ], 37: [ Species.SLOWBRO ] },
      { 1: [ Species.GOLDEEN ], 33: [ Species.SEAKING ] },
      { 1: [ Species.MAGIKARP ], 20: [ Species.GYARADOS ] },
      { 1: [ Species.MARILL ], 18: [ Species.AZUMARILL ] },
      { 1: [ Species.LOTAD ], 14: [ Species.LOMBRE ] },
      { 1: [ Species.DUCKLETT ], 35: [ Species.SWANNA ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.WOOPER ], 20: [ Species.QUAGSIRE ] }, { 1: [ Species.SURSKIT ], 22: [ Species.MASQUERAIN ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.SQUIRTLE ], 16: [ Species.WARTORTLE ], 36: [ Species.BLASTOISE ] }, { 1: [ Species.OSHAWOTT ], 17: [ Species.DEWOTT ], 36: [ Species.SAMUROTT ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.VAPOREON, Species.SLOWKING ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.SUICUNE, Species.MESPRIT ],
    [BiomePoolTier.BOSS]: [ Species.GOLDUCK, Species.SLOWBRO, Species.SEAKING, Species.GYARADOS, Species.AZUMARILL, Species.MASQUERAIN, Species.SWANNA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.BLASTOISE, Species.VAPOREON, Species.SLOWKING, Species.SAMUROTT ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.SUICUNE, Species.MESPRIT ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.SEABED]: {
    [BiomePoolTier.COMMON]: [ { 1: [ Species.CHINCHOU ], 27: [ Species.LANTURN ] }, Species.REMORAID, Species.CLAMPERL, Species.BASCULIN, { 1: [ Species.FRILLISH ], 40: [ Species.JELLICENT ] } ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.TENTACOOL ], 30: [ Species.TENTACRUEL ] }, Species.SHELLDER, { 1: [ Species.WAILMER ], 40: [ Species.WAILORD ] }, Species.LUVDISC, { 1: [ Species.SHELLOS ], 30: [ Species.GASTRODON ] } ],
    [BiomePoolTier.RARE]: [ Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, { 1: [ Species.MANTYKE ], 20: [ Species.MANTINE ] }, Species.PHIONE, Species.ALOMOMOLA, { 1: [ Species.TYNAMO ], 39: [ Species.EELEKTRIK ] } ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.OMANYTE ], 40: [ Species.OMASTAR ] }, { 1: [ Species.KABUTO ], 40: [ Species.KABUTOPS ] }, Species.RELICANTH ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.FEEBAS, Species.MANAPHY ],
    [BiomePoolTier.BOSS]: [ Species.LANTURN, Species.QWILFISH, Species.CORSOLA, Species.OCTILLERY, Species.MANTINE, Species.WAILORD, Species.HUNTAIL, Species.GOREBYSS, Species.LUVDISC, Species.JELLICENT, Species.ALOMOMOLA ],
    [BiomePoolTier.BOSS_RARE]: [ Species.OMASTAR, Species.KABUTOPS, Species.RELICANTH, Species.PHIONE, Species.EELEKTROSS ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MILOTIC, Species.MANAPHY ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.KYOGRE ]
  },
  [Biome.MOUNTAIN]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.PIDGEY ], 18: [ Species.PIDGEOTTO ], 36: [ Species.PIDGEOT ] },
      { 1: [ Species.SPEAROW ], 20: [ Species.FEAROW ] },
      { 1: [ Species.TAILLOW ], 22: [ Species.SWELLOW ] },
      { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] },
      { 1: [ Species.STARLY ], 14: [ Species.STARAVIA ], 34: [ Species.STARAPTOR ] },
      { 1: [ Species.PIDOVE ], 21: [ Species.TRANQUILL ], 32: [ Species.UNFEZANT ] }
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
    [BiomePoolTier.RARE]: [ Species.MURKROW, Species.SKARMORY, { 1: [ Species.TORCHIC ], 16: [ Species.COMBUSKEN ], 36: [ Species.BLAZIKEN ] }, { 1: [ Species.SPOINK ], 32: [ Species.GRUMPIG ] }, Species.VULLABY ],
    [BiomePoolTier.SUPER_RARE]: [
      { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ] },
      { 1: [ Species.CRANIDOS ], 30: [ Species.RAMPARDOS ] },
      { 1: [ Species.SHIELDON ], 30: [ Species.BASTIODON ] },
      { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
      { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ] }
    ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.TORNADUS ],
    [BiomePoolTier.BOSS]: [ Species.PIDGEOT, Species.FEAROW, Species.SKARMORY, Species.SWELLOW, Species.AGGRON, Species.ALTARIA, Species.STARAPTOR, Species.UNFEZANT, Species.BRAVIARY, Species.MANDIBUZZ ],
    [BiomePoolTier.BOSS_RARE]: [ Species.BLAZIKEN, Species.RAMPARDOS, Species.BASTIODON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.TORNADUS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.HO_OH ]
  },
  [Biome.LAND]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.DIGLETT ], 26: [ Species.DUGTRIO ] },
      { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] },
      { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] },
      { 1: [ Species.RHYHORN ], 42: [ Species.RHYDON ] },
      { 1: [ Species.PHANPY ], 25: [ Species.DONPHAN ] },
      { 1: [ Species.DRILBUR ], 31: [ Species.EXCADRILL ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] }, { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] }, { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] } ],
    [BiomePoolTier.RARE]: [ Species.ONIX, Species.GLIGAR ],
    [BiomePoolTier.SUPER_RARE]: [],
    [BiomePoolTier.ULTRA_RARE]: [ Species.LANDORUS ],
    [BiomePoolTier.BOSS]: [ Species.DUGTRIO, Species.GOLEM, Species.MAROWAK, Species.DONPHAN, Species.RHYPERIOR, Species.GLISCOR, Species.EXCADRILL ],
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
      Species.MAWILE,
      { 1: [ Species.ROGGENROLA ], 25: [ Species.BOLDORE ] },
      { 1: [ Species.WOOBAT ], 20: [ Species.SWOOBAT ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.GEODUDE ], 25: [ Species.GRAVELER ] }, { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] }, Species.NOSEPASS ],
    [BiomePoolTier.RARE]: [ Species.ONIX, { 1: [ Species.FERROSEED ], 40: [ Species.FERROTHORN ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SHUCKLE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGISTEEL, Species.UXIE ],
    [BiomePoolTier.BOSS]: [ Species.PARASECT, Species.ONIX, Species.CROBAT, Species.URSARING, Species.EXPLOUD, Species.MAWILE, Species.PROBOPASS, Species.GIGALITH, Species.SWOOBAT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.SHUCKLE, Species.FERROTHORN ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.REGISTEEL, Species.UXIE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.DESERT]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.SANDSHREW ], 22: [ Species.SANDSLASH ] },
      Species.TRAPINCH,
      { 1: [ Species.CACNEA ], 32: [ Species.CACTURNE ] },
      { 1: [ Species.HIPPOPOTAS ], 34: [ Species.HIPPOWDON ] },
      { 1: [ Species.SKORUPI ], 40: [ Species.DRAPION ] },
      { 1: [ Species.SANDILE ], 29: [ Species.KROKOROK ], 40: [ Species.KROOKODILE ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] }, Species.MARACTUS ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] }, { 1: [ Species.DARUMAKA ], 35: [ Species.DARMANITAN ] }, { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] } ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.LILEEP ], 40: [ Species.CRADILY ] }, { 1: [ Species.ANORITH ], 40: [ Species.ARMALDO ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGIROCK ],
    [BiomePoolTier.BOSS]: [ Species.SANDSLASH, Species.CACTURNE, Species.HIPPOWDON, Species.DRAPION, Species.KROOKODILE, Species.DARMANITAN, Species.MARACTUS ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CRADILY, Species.ARMALDO ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.REGIROCK ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.ICE_CAVE]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.SEEL ], 34: [ Species.DEWGONG ] },
      { 1: [ Species.SWINUB ], 33: [ Species.PILOSWINE ] },
      { 1: [ Species.SPHEAL ], 32: [ Species.SEALEO ], 44: [ Species.WALREIN ] },
      { 1: [ Species.SNOVER ], 40: [ Species.ABOMASNOW ] },
      { 1: [ Species.VANILLITE ], 35: [ Species.VANILLISH ], 47: [ Species.VANILLUXE ] },
      { 1: [ Species.CUBCHOO ], 37: [ Species.BEARTIC ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.SNEASEL, { 1: [ Species.SNORUNT ], 42: [ Species.GLALIE ] } ],
    [BiomePoolTier.RARE]: [ Species.JYNX, Species.LAPRAS, Species.FROSLASS, Species.CRYOGONAL ],
    [BiomePoolTier.SUPER_RARE]: [ Species.DELIBIRD ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.REGICE ],
    [BiomePoolTier.BOSS]: [ Species.DEWGONG, Species.GLALIE, Species.WALREIN, Species.ABOMASNOW, Species.WEAVILE, Species.MAMOSWINE, Species.FROSLASS, Species.VANILLUXE, Species.BEARTIC, Species.CRYOGONAL ],
    [BiomePoolTier.BOSS_RARE]: [ Species.JYNX, Species.LAPRAS, Species.GLACEON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.ARTICUNO, Species.REGICE ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.KYUREM ]
  },
  [Biome.MEADOW]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.JIGGLYPUFF ], 30: [ Species.WIGGLYTUFF ] },
      { 1: [ Species.LEDYBA ], 18: [ Species.LEDIAN ] },
      { 1: [ Species.SNUBBULL ], 23: [ Species.GRANBULL ] },
      Species.ROSELIA,
      { 1: [ Species.BLITZLE ], 27: [ Species.ZEBSTRIKA ] },
      { 1: [ Species.COTTONEE ], 20: [ Species.WHIMSICOTT ] },
      Species.MINCCINO
    ],
    [BiomePoolTier.UNCOMMON]: [
      Species.CLEFAIRY,
      { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] },
      Species.TOGETIC,
      { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ], 30: [ Species.AMPHAROS ] },
      { 1: [ Species.RALTS ], 20: [ Species.KIRLIA ], 30: [ Species.GARDEVOIR ] },
      { 1: [ Species.SKITTY ], 20: [ Species.DELCATTY ] },
      { 1: [ Species.GLAMEOW ], 38: [ Species.PURUGLY ] },
      Species.BOUFFALANT
    ],
    [BiomePoolTier.RARE]: [ Species.TAUROS, Species.EEVEE, Species.MILTANK, Species.VOLBEAT, Species.ILLUMISE, Species.SPINDA ],
    [BiomePoolTier.SUPER_RARE]: [ Species.CHANSEY ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.MELOETTA ],
    [BiomePoolTier.BOSS]: [ Species.WIGGLYTUFF, Species.TAUROS, Species.LEDIAN, Species.GRANBULL, Species.MILTANK, Species.GARDEVOIR, Species.DELCATTY, Species.ROSERADE, Species.PURUGLY, Species.TOGEKISS, Species.ZEBSTRIKA, Species.CINCCINO, Species.BOUFFALANT ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CLEFABLE, Species.BLISSEY ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MELOETTA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.POWER_PLANT]: {
    [BiomePoolTier.COMMON]: [
      Species.PIKACHU,
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
      { 1: [ Species.ELECTRIKE ], 26: [ Species.MANECTRIC ] },
      { 1: [ Species.SHINX ], 15: [ Species.LUXIO ], 30: [ Species.LUXRAY ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ Species.ELECTABUZZ, Species.PLUSLE, Species.MINUN, Species.PACHIRISU, Species.EMOLGA ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.MAREEP ], 15: [ Species.FLAAFFY ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.JOLTEON ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.RAIKOU, Species.ROTOM, Species.THUNDURUS ],
    [BiomePoolTier.BOSS]: [ Species.RAICHU, Species.MANECTRIC, Species.LUXRAY, Species.MAGNEZONE, Species.ELECTIVIRE ],
    [BiomePoolTier.BOSS_RARE]: [ Species.JOLTEON, Species.AMPHAROS ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.ZAPDOS, Species.RAIKOU, Species.ROTOM, Species.THUNDURUS ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.ZEKROM ]
  },
  [Biome.VOLCANO]: {
    [BiomePoolTier.COMMON]: [ Species.VULPIX, Species.GROWLITHE, { 1: [ Species.PONYTA ], 40: [ Species.RAPIDASH ] }, { 1: [ Species.SLUGMA ], 38: [ Species.MAGCARGO ] }, { 1: [ Species.NUMEL ], 33: [ Species.CAMERUPT ] } ],
    [BiomePoolTier.UNCOMMON]: [ Species.MAGMAR, Species.TORKOAL, { 1: [ Species.PANSEAR ], 20: [ Species.SIMISEAR ] }, Species.HEATMOR ],
    [BiomePoolTier.RARE]: [
      { 1: [ Species.CHARMANDER ], 16: [ Species.CHARMELEON ], 36: [ Species.CHARIZARD ] },
      { 1: [ Species.CYNDAQUIL ], 14: [ Species.QUILAVA ], 36: [ Species.TYPHLOSION ] },
      { 1: [ Species.CHIMCHAR ], 14: [ Species.MONFERNO ], 36: [ Species.INFERNAPE ] },
      { 1: [ Species.TEPIG ], 17: [ Species.PIGNITE ], 36: [ Species.EMBOAR ] }
    ],
    [BiomePoolTier.SUPER_RARE]: [ Species.FLAREON, { 1: [ Species.LARVESTA ], 59: [ Species.VOLCARONA ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.ENTEI, Species.HEATRAN ],
    [BiomePoolTier.BOSS]: [ Species.NINETALES, Species.ARCANINE, Species.RAPIDASH, Species.MAGCARGO, Species.CAMERUPT, Species.TORKOAL, Species.MAGMORTAR, Species.SIMISEAR, Species.HEATMOR ],
    [BiomePoolTier.BOSS_RARE]: [ Species.CHARIZARD, Species.FLAREON, Species.TYPHLOSION, Species.INFERNAPE, Species.EMBOAR, Species.VOLCARONA ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.MOLTRES, Species.ENTEI, Species.HEATRAN ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.RESHIRAM ]
  },
  [Biome.GRAVEYARD]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.GASTLY ], 25: [ Species.HAUNTER ] },
      { 1: [ Species.SHUPPET ], 37: [ Species.BANETTE ] },
      { 1: [ Species.DUSKULL ], 37: [ Species.DUSCLOPS ] },
      { 1: [ Species.DRIFLOON ], 28: [ Species.DRIFBLIM ] },
      { 1: [ Species.LITWICK ], 41: [ Species.LAMPENT ] },
      { 1: [ Species.GOLETT ], 43: [ Species.GOLURK ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.CUBONE ], 28: [ Species.MAROWAK ] }, { 1: [ Species.YAMASK ], 34: [ Species.COFAGRIGUS ] } ],
    [BiomePoolTier.RARE]: [ Species.MISDREAVUS, { 1: [ Species.CHINGLING ], 20: [ Species.CHIMECHO ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.SPIRITOMB ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.GENGAR, Species.BANETTE, Species.DRIFBLIM, Species.MISMAGIUS, Species.DUSKNOIR, Species.COFAGRIGUS, Species.CHANDELURE, Species.GOLURK ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.GIRATINA ]
  },
  [Biome.DOJO]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MANKEY ], 28: [ Species.PRIMEAPE ] },
      { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
      { 1: [ Species.MAKUHITA ], 24: [ Species.HARIYAMA ] },
      { 1: [ Species.MEDITITE ], 37: [ Species.MEDICHAM ] },
      { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.CROAGUNK ], 37: [ Species.TOXICROAK ] }, { 1: [ Species.SCRAGGY ], 39: [ Species.SCRAFTY ] }, { 1: [ Species.MIENFOO ], 50: [ Species.MIENSHAO ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.TYROGUE ], 20: [ Species.HITMONLEE ] }, Species.HITMONCHAN, Species.LUCARIO, Species.THROH, Species.SAWK ],
    [BiomePoolTier.SUPER_RARE]: [ Species.HITMONTOP, Species.GALLADE ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.COBALION, Species.TERRAKION, Species.VIRIZION ],
    [BiomePoolTier.BOSS]: [ Species.PRIMEAPE, Species.MACHAMP, Species.HITMONLEE, Species.HITMONCHAN, Species.HARIYAMA, Species.MEDICHAM, Species.LUCARIO, Species.TOXICROAK, Species.THROH, Species.SAWK, Species.SCRAFTY, Species.MIENSHAO ],
    [BiomePoolTier.BOSS_RARE]: [ Species.HITMONTOP, Species.GALLADE ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.COBALION, Species.TERRAKION, Species.VIRIZION ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: []
  },
  [Biome.FACTORY]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.MACHOP ], 28: [ Species.MACHOKE ] },
      { 1: [ Species.MAGNEMITE ], 30: [ Species.MAGNETON ] },
      { 1: [ Species.VOLTORB ], 30: [ Species.ELECTRODE ] },
      { 1: [ Species.TIMBURR ], 25: [ Species.GURDURR ] },
      { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] } ],
    [BiomePoolTier.RARE]: [],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.PORYGON ], 20: [ Species.PORYGON2 ] }, { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.GENESECT ],
    [BiomePoolTier.BOSS]: [ Species.CONKELDURR, Species.KLINKLANG ],
    [BiomePoolTier.BOSS_RARE]: [],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.GENESECT ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.MEWTWO ]
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
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.ABRA ], 16: [ Species.KADABRA ] }, { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, Species.SIGILYPH, { 1: [ Species.KLINK ], 38: [ Species.KLANG ], 49: [ Species.KLINKLANG ] } ],
    [BiomePoolTier.RARE]: [ Species.MR_MIME, Species.WOBBUFFET, { 1: [ Species.GOTHITA ], 32: [ Species.GOTHORITA ], 41: [ Species.GOTHITELLE ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.ESPEON, { 1: [ Species.ARCHEN ], 37: [ Species.ARCHEOPS ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.MEW, Species.VICTINI ],
    [BiomePoolTier.BOSS]: [ Species.ALAKAZAM, Species.HYPNO, Species.XATU, Species.GRUMPIG, Species.CLAYDOL, Species.SIGILYPH, Species.GOTHITELLE, Species.BEHEEYEM ],
    [BiomePoolTier.BOSS_RARE]: [ Species.MR_MIME, Species.ESPEON, Species.WOBBUFFET, Species.ARCHEOPS ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.VICTINI ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.MEW, Species.REGIGIGAS ]
  },
  [Biome.WASTELAND]: {
    [BiomePoolTier.COMMON]: [
      { 1: [ Species.LARVITAR ], 30: [ Species.PUPITAR ], 55: [ Species.TYRANITAR ] },
      { 1: [ Species.VIBRAVA ], 45: [ Species.FLYGON ] },
      { 1: [ Species.BAGON ], 30: [ Species.SHELGON ], 50: [ Species.SALAMENCE ] },
      { 1: [ Species.GIBLE ], 24: [ Species.GABITE ], 48: [ Species.GARCHOMP ] },
      { 1: [ Species.AXEW ], 38: [ Species.FRAXURE ], 48: [ Species.HAXORUS ] }
    ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.SWABLU ], 35: [ Species.ALTARIA ] }, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.DRATINI ], 30: [ Species.DRAGONAIR ], 55: [ Species.DRAGONITE ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.AERODACTYL, Species.DRUDDIGON ],
    [BiomePoolTier.ULTRA_RARE]: [],
    [BiomePoolTier.BOSS]: [ Species.DRAGONITE, Species.TYRANITAR, Species.FLYGON, Species.SALAMENCE, Species.GARCHOMP, Species.HAXORUS ],
    [BiomePoolTier.BOSS_RARE]: [ Species.AERODACTYL, Species.DRUDDIGON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.DIALGA ]
  },
  [Biome.ABYSS]: {
    [BiomePoolTier.COMMON]: [ Species.MURKROW, { 1: [ Species.HOUNDOUR ], 24: [ Species.HOUNDOOM ] }, Species.SABLEYE, { 1: [ Species.PURRLOIN ], 20: [ Species.LIEPARD ] }, { 1: [ Species.PAWNIARD ], 52: [ Species.BISHARP ] } ],
    [BiomePoolTier.UNCOMMON]: [],
    [BiomePoolTier.RARE]: [ Species.ABSOL, Species.SPIRITOMB, { 1: [ Species.ZORUA ], 30: [ Species.ZOROARK ] }, { 1: [ Species.DEINO ], 50: [ Species.ZWEILOUS ], 64: [ Species.HYDREIGON ] } ],
    [BiomePoolTier.SUPER_RARE]: [ Species.UMBREON ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.DARKRAI ],
    [BiomePoolTier.BOSS]: [ Species.HOUNDOOM, Species.SABLEYE, Species.ABSOL, Species.HONCHKROW, Species.SPIRITOMB, Species.LIEPARD, Species.ZOROARK, Species.BISHARP, Species.HYDREIGON ],
    [BiomePoolTier.BOSS_RARE]: [ Species.UMBREON ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.DARKRAI ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.PALKIA ]
  },
  [Biome.SPACE]: {
    [BiomePoolTier.COMMON]: [ Species.CLEFAIRY, Species.LUNATONE, Species.SOLROCK, { 1: [ Species.BRONZOR ], 33: [ Species.BRONZONG ] }, { 1: [ Species.MUNNA ], 30: [ Species.MUSHARNA ] } ],
    [BiomePoolTier.UNCOMMON]: [ { 1: [ Species.BALTOY ], 36: [ Species.CLAYDOL ] }, { 1: [ Species.CHINGLING ], 20: [ Species.CHIMECHO ] }, { 1: [ Species.ELGYEM ], 42: [ Species.BEHEEYEM ] } ],
    [BiomePoolTier.RARE]: [ { 1: [ Species.BELDUM ], 20: [ Species.METANG ], 45: [ Species.METAGROSS ] }, Species.SIGILYPH, { 1: [ Species.SOLOSIS ], 32: [ Species.DUOSION ], 41: [ Species.REUNICLUS ] } ],
    [BiomePoolTier.SUPER_RARE]: [ { 1: [ Species.PORYGON ], 20: [ Species.PORYGON2 ] } ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.JIRACHI, Species.DEOXYS, Species.CRESSELIA ],
    [BiomePoolTier.BOSS]: [ Species.CLEFABLE, Species.LUNATONE, Species.SOLROCK, Species.CHIMECHO, Species.BRONZONG, Species.MUSHARNA, Species.REUNICLUS ],
    [BiomePoolTier.BOSS_RARE]: [ Species.METAGROSS, Species.PORYGON_Z ],
    [BiomePoolTier.BOSS_SUPER_RARE]: [ Species.JIRACHI, Species.DEOXYS, Species.CRESSELIA ],
    [BiomePoolTier.BOSS_ULTRA_RARE]: [ Species.RAYQUAZA, Species.ARCEUS ]
  },
  [Biome.END]: {
    [BiomePoolTier.COMMON]: [ Species.ARCANINE, Species.DRAGONITE, Species.TYRANITAR, Species.SALAMENCE, Species.GARCHOMP, Species.HYDREIGON, Species.VOLCARONA ],
    [BiomePoolTier.UNCOMMON]: [ Species.KINGDRA, Species.METAGROSS, Species.MAGNEZONE, Species.RHYPERIOR, Species.TANGROWTH, Species.ELECTIVIRE, Species.MAGMORTAR, Species.TOGEKISS, Species.MAMOSWINE ],
    [BiomePoolTier.RARE]: [ Species.BLISSEY, Species.PORYGON_Z ],
    [BiomePoolTier.SUPER_RARE]: [ Species.REGIGIGAS, Species.GENESECT ],
    [BiomePoolTier.ULTRA_RARE]: [ Species.MEWTWO, Species.RAYQUAZA, Species.ARCEUS ],
    [BiomePoolTier.BOSS]: [ Species.ETERNATUS ],
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
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.RATICATE, Type.NORMAL, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ]
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
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.RAICHU, Type.ELECTRIC, -1, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
      ]
    ],
    [ Species.SANDSHREW, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SANDSLASH, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
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
        [ Biome.PLAINS, BiomePoolTier.RARE ],
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.SPACE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CLEFABLE, Type.FAIRY, -1, [
        [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ],
        [ Biome.SPACE, BiomePoolTier.BOSS ],
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
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WIGGLYTUFF, Type.NORMAL, Type.FAIRY, [
        [ Biome.MEADOW, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
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
        [ Biome.LAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DUGTRIO, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.LAND, BiomePoolTier.BOSS ]
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
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.DOJO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.GROWLITHE, Type.FIRE, -1, [
        [ Biome.GRASS, BiomePoolTier.RARE ],
        [ Biome.VOLCANO, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ARCANINE, Type.FIRE, -1, [
        [ Biome.VOLCANO, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
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
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MACHOKE, Type.FIGHTING, -1, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MACHAMP, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.BOSS ]
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
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.GRAVELER, Type.ROCK, Type.GROUND, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.GOLEM, Type.ROCK, Type.GROUND, [
        [ Biome.LAND, BiomePoolTier.BOSS ]
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
        [ Biome.LAKE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SLOWBRO, Type.WATER, Type.PSYCHIC, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.MAGNEMITE, Type.ELECTRIC, Type.STEEL, [
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MAGNETON, Type.ELECTRIC, Type.STEEL, [
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
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
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MUK, Type.POISON, -1, [
        [ Biome.CITY, BiomePoolTier.BOSS ]
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
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.HAUNTER, Type.GHOST, Type.POISON, [
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GENGAR, Type.GHOST, Type.POISON, [
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ONIX, Type.ROCK, Type.GROUND, [
        [ Biome.LAND, BiomePoolTier.RARE ],
        [ Biome.CAVE, BiomePoolTier.RARE ],
        [ Biome.CAVE, BiomePoolTier.BOSS ]
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
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ELECTRODE, Type.ELECTRIC, -1, [
        [ Biome.POWER_PLANT, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.EXEGGCUTE, Type.GRASS, Type.PSYCHIC, [
        [ Biome.GRASS, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.EXEGGUTOR, Type.GRASS, Type.PSYCHIC, [
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CUBONE, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MAROWAK, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.HITMONLEE, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.HITMONCHAN, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.LICKITUNG, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.KOFFING, Type.POISON, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WEEZING, Type.POISON, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.RHYHORN, Type.GROUND, Type.ROCK, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.RHYDON, Type.GROUND, Type.ROCK, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CHANSEY, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.MEADOW, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.TANGELA, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.KANGASKHAN, Type.NORMAL, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.SUPER_RARE ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
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
        [ Biome.FOREST, BiomePoolTier.RARE ]
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
        [ Biome.CITY, BiomePoolTier.ULTRA_RARE ]
      ]
    ],
    [ Species.EEVEE, Type.NORMAL, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
        [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.CITY, BiomePoolTier.SUPER_RARE ],
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
        [ Biome.SPACE, BiomePoolTier.SUPER_RARE ]
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
        [ Biome.WASTELAND, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MEWTWO, Type.PSYCHIC, -1, [
        [ Biome.FACTORY, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.END, BiomePoolTier.ULTRA_RARE ]
      ]
    ],
    [ Species.MEW, Type.PSYCHIC, -1, [
        [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ARIADOS, Type.BUG, Type.POISON, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
    [ Species.PICHU, Type.ELECTRIC, -1, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.CLEFFA, Type.FAIRY, -1, [
        [ Biome.TOWN, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.IGGLYBUFF, Type.NORMAL, Type.FAIRY, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TOGEPI, Type.FAIRY, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.TOGETIC, Type.FAIRY, Type.FLYING, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.NATU, Type.PSYCHIC, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.XATU, Type.PSYCHIC, Type.FLYING, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.COMMON ],
        [ Biome.RUINS, BiomePoolTier.BOSS ]
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
        [ Biome.LAKE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.AZUMARILL, Type.WATER, Type.FAIRY, [
        [ Biome.LAKE, BiomePoolTier.COMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
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
        [ Biome.FOREST, BiomePoolTier.RARE ]
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
        [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS_RARE ]
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
        [ Biome.LAND, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.STEELIX, Type.STEEL, Type.GROUND, [
        [ Biome.LAND, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.SNUBBULL, Type.FAIRY, -1, [
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GRANBULL, Type.FAIRY, -1, [
        [ Biome.MEADOW, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.QWILFISH, Type.WATER, Type.POISON, [
        [ Biome.SEABED, BiomePoolTier.RARE ],
        [ Biome.SEABED, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SCIZOR, Type.BUG, Type.STEEL, [
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
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
        [ Biome.ICE_CAVE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TEDDIURSA, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.URSARING, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.BOSS ]
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
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.PILOSWINE, Type.ICE, Type.GROUND, [
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON]
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
        [ Biome.ICE_CAVE, BiomePoolTier.SUPER_RARE ]
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
        [ Biome.SEA, BiomePoolTier.BOSS_RARE ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.PHANPY, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DONPHAN, Type.GROUND, -1, [
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.LAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PORYGON2, Type.NORMAL, -1, [
        [ Biome.FACTORY, BiomePoolTier.SUPER_RARE ],
        [ Biome.SPACE, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.STANTLER, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.SMEARGLE, Type.NORMAL, -1, [
        [ Biome.CITY, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.TYROGUE, Type.FIGHTING, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ],
        [ Biome.DOJO, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.HITMONTOP, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.SUPER_RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.SMOOCHUM, Type.ICE, Type.PSYCHIC, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.ELEKID, Type.ELECTRIC, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.MAGBY, Type.FIRE, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.MILTANK, Type.NORMAL, -1, [
        [ Biome.MEADOW, BiomePoolTier.RARE ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BLISSEY, Type.NORMAL, -1, [
        [ Biome.MEADOW, BiomePoolTier.BOSS_RARE ],
        [ Biome.END, BiomePoolTier.RARE ]
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
        [ Biome.WASTELAND, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
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
    [ Species.CELEBI, Type.PSYCHIC, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.ULTRA_RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
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
        [ Biome.PLAINS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LINOONE, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.COMMON ],
        [ Biome.PLAINS, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.KIRLIA, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.GARDEVOIR, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SURSKIT, Type.BUG, Type.WATER, [
        [ Biome.TOWN, BiomePoolTier.RARE ],
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MASQUERAIN, Type.BUG, Type.FLYING, [
        [ Biome.TOWN, BiomePoolTier.RARE ],
        [ Biome.LAKE, BiomePoolTier.UNCOMMON ],
        [ Biome.LAKE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SHROOMISH, Type.GRASS, -1, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BRELOOM, Type.GRASS, Type.FIGHTING, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SLAKOTH, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.VIGOROTH, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.SLAKING, Type.NORMAL, -1, [
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
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
    [ Species.AZURILL, Type.NORMAL, Type.FAIRY, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ]
      ]
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
        [ Biome.CAVE, BiomePoolTier.COMMON ],
        [ Biome.CAVE, BiomePoolTier.BOSS ]
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
        [ Biome.SEA, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SHARPEDO, Type.WATER, Type.DARK, [
        [ Biome.SEA, BiomePoolTier.COMMON ],
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
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
        [ Biome.VOLCANO, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CAMERUPT, Type.FIRE, Type.GROUND, [
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
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
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.COMMON ],
        [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.CLAYDOL, Type.GROUND, Type.PSYCHIC, [
        [ Biome.DESERT, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.COMMON ],
        [ Biome.RUINS, BiomePoolTier.BOSS ],
        [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
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
        [ Biome.CITY, BiomePoolTier.ULTRA_RARE ],
        [ Biome.CITY, BiomePoolTier.BOSS_RARE ]
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
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DUSCLOPS, Type.GHOST, -1, [
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.TROPIUS, Type.GRASS, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.TALL_GRASS, BiomePoolTier.RARE ],
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CHIMECHO, Type.PSYCHIC, -1, [
        [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
        [ Biome.SPACE, BiomePoolTier.UNCOMMON ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ABSOL, Type.DARK, -1, [
        [ Biome.ABYSS, BiomePoolTier.RARE ],
        [ Biome.ABYSS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.WYNAUT, Type.PSYCHIC, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
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
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SEALEO, Type.ICE, Type.WATER, [
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WALREIN, Type.ICE, Type.WATER, [
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
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
        [ Biome.WASTELAND, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
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
        [ Biome.SPACE, BiomePoolTier.BOSS_RARE ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
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
        [ Biome.CAVE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.CAVE, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.LAND, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
    ],
    [ Species.RAYQUAZA, Type.DRAGON, Type.FLYING, [
        [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.END, BiomePoolTier.ULTRA_RARE ]
      ]
    ],
    [ Species.JIRACHI, Type.STEEL, Type.PSYCHIC, [
        [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.DEOXYS, Type.PSYCHIC, -1, [
        [ Biome.SPACE, BiomePoolTier.ULTRA_RARE ],
        [ Biome.SPACE, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.KRICKETUNE, Type.BUG, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.UNCOMMON ],
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
    [ Species.BUDEW, Type.GRASS, Type.POISON, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ]
      ]
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
        [ Biome.CITY, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.BEACH, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.WORMADAM, Type.BUG, Type.GRASS, [
        [ Biome.CITY, BiomePoolTier.UNCOMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ],
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ],
        [ Biome.BEACH, BiomePoolTier.UNCOMMON ],
        [ Biome.BEACH, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.VESPIQUEN, Type.BUG, Type.FLYING, [
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CHERRIM, Type.GRASS, -1, [
        [ Biome.TOWN, BiomePoolTier.UNCOMMON ],
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.PURUGLY, Type.NORMAL, -1, [
        [ Biome.MEADOW, BiomePoolTier.UNCOMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.CHINGLING, Type.PSYCHIC, -1, [
        [ Biome.GRAVEYARD, BiomePoolTier.RARE ],
        [ Biome.SPACE, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.STUNKY, Type.POISON, Type.DARK, [
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SKUNTANK, Type.POISON, Type.DARK, [
        [ Biome.CITY, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BRONZOR, Type.STEEL, Type.PSYCHIC, [
        [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
        [ Biome.SPACE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BRONZONG, Type.STEEL, Type.PSYCHIC, [
        [ Biome.FACTORY, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
        [ Biome.SPACE, BiomePoolTier.COMMON ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BONSLY, Type.ROCK, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.MIME_JR, Type.PSYCHIC, Type.FAIRY, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.HAPPINY, Type.NORMAL, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.CHATOT, Type.NORMAL, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.SUPER_RARE ]
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
        [ Biome.WASTELAND, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.MUNCHLAX, Type.NORMAL, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.RIOLU, Type.FIGHTING, -1, [
        [ Biome.TOWN, BiomePoolTier.SUPER_RARE ]
      ]
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
        [ Biome.DESERT, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.DRAPION, Type.POISON, Type.DARK, [
        [ Biome.SWAMP, BiomePoolTier.UNCOMMON ],
        [ Biome.DESERT, BiomePoolTier.COMMON ],
        [ Biome.DESERT, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.RARE ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ABOMASNOW, Type.GRASS, Type.ICE, [
        [ Biome.ICE_CAVE, BiomePoolTier.COMMON ],
        [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.WEAVILE, Type.DARK, Type.ICE, [
        [ Biome.ICE_CAVE, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.MAGNEZONE, Type.ELECTRIC, Type.STEEL, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.LICKILICKY, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.RHYPERIOR, Type.GROUND, Type.ROCK, [
        [ Biome.LAND, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TANGROWTH, Type.GRASS, -1, [
        [ Biome.TALL_GRASS, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.ELECTIVIRE, Type.ELECTRIC, -1, [
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.MAGMORTAR, Type.FIRE, -1, [
        [ Biome.VOLCANO, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.TOGEKISS, Type.FAIRY, Type.FLYING, [
        [ Biome.MEADOW, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.YANMEGA, Type.BUG, Type.FLYING, [
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.LEAFEON, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.GLACEON, Type.ICE, -1, [
        [ Biome.ICE_CAVE, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.GLISCOR, Type.GROUND, Type.FLYING, [
        [ Biome.LAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.MAMOSWINE, Type.ICE, Type.GROUND, [
        [ Biome.ICE_CAVE, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.PORYGON_Z, Type.NORMAL, -1, [
        [ Biome.SPACE, BiomePoolTier.BOSS_RARE ],
        [ Biome.END, BiomePoolTier.RARE ]
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
        [ Biome.POWER_PLANT, BiomePoolTier.ULTRA_RARE ],
        [ Biome.POWER_PLANT, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.RUINS, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.END, BiomePoolTier.SUPER_RARE ]
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
    [ Species.PHIONE, Type.WATER, -1, [
        [ Biome.SEABED, BiomePoolTier.RARE ],
        [ Biome.SEABED, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.MANAPHY, Type.WATER, -1, [
        [ Biome.SEABED, BiomePoolTier.ULTRA_RARE ],
        [ Biome.SEABED, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.DARKRAI, Type.DARK, -1, [
        [ Biome.ABYSS, BiomePoolTier.ULTRA_RARE ],
        [ Biome.ABYSS, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.SHAYMIN, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.BOSS_ULTRA_RARE ]
      ]
    ],
    [ Species.ARCEUS, Type.NORMAL, -1, [
        [ Biome.SPACE, BiomePoolTier.BOSS_ULTRA_RARE ],
        [ Biome.END, BiomePoolTier.ULTRA_RARE ]
      ]
    ],
    [ Species.VICTINI, Type.PSYCHIC, Type.FIRE, [
        [ Biome.RUINS, BiomePoolTier.ULTRA_RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.SNIVY, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.SERVINE, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.SERPERIOR, Type.GRASS, -1, [
        [ Biome.GRASS, BiomePoolTier.RARE ],
        [ Biome.GRASS, BiomePoolTier.BOSS_RARE ]
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
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.WATCHOG, Type.NORMAL, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.LILLIPUP, Type.NORMAL, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.HERDIER, Type.NORMAL, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.STOUTLAND, Type.NORMAL, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PURRLOIN, Type.DARK, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LIEPARD, Type.DARK, -1, [
        [ Biome.TOWN, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PANSAGE, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SIMISAGE, Type.GRASS, -1, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PANSEAR, Type.FIRE, -1, [
        [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SIMISEAR, Type.FIRE, -1, [
        [ Biome.VOLCANO, BiomePoolTier.UNCOMMON ],
        [ Biome.VOLCANO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PANPOUR, Type.WATER, -1, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SIMIPOUR, Type.WATER, -1, [
        [ Biome.SEA, BiomePoolTier.UNCOMMON ],
        [ Biome.SEA, BiomePoolTier.BOSS ]
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
        [ Biome.MEADOW, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.ZEBSTRIKA, Type.ELECTRIC, -1, [
        [ Biome.MEADOW, BiomePoolTier.COMMON ],
        [ Biome.MEADOW, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.ROGGENROLA, Type.ROCK, -1, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
        [ Biome.CAVE, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BOLDORE, Type.ROCK, -1, [
        [ Biome.MOUNTAIN, BiomePoolTier.UNCOMMON ],
        [ Biome.LAND, BiomePoolTier.UNCOMMON ],
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
        [ Biome.LAND, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.EXCADRILL, Type.GROUND, Type.STEEL, [
        [ Biome.LAND, BiomePoolTier.COMMON ],
        [ Biome.LAND, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.AUDINO, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.PLAINS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.TIMBURR, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GURDURR, Type.FIGHTING, -1, [
        [ Biome.DOJO, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.CONKELDURR, Type.FIGHTING, -1, [
        [ Biome.FACTORY, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.SWADLOON, Type.BUG, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LEAVANNY, Type.BUG, Type.GRASS, [
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.DOJO, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.SCRAFTY, Type.DARK, Type.FIGHTING, [
        [ Biome.DOJO, BiomePoolTier.UNCOMMON ],
        [ Biome.DOJO, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.SIGILYPH, Type.PSYCHIC, Type.FLYING, [
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ],
        [ Biome.RUINS, BiomePoolTier.BOSS ],
        [ Biome.SPACE, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.YAMASK, Type.GHOST, -1, [
        [ Biome.DESERT, BiomePoolTier.RARE ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.COFAGRIGUS, Type.GHOST, -1, [
        [ Biome.DESERT, BiomePoolTier.RARE ],
        [ Biome.GRAVEYARD, BiomePoolTier.UNCOMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.TIRTOUGA, Type.WATER, Type.ROCK, [
        [ Biome.BEACH, BiomePoolTier.COMMON ],
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.CARRACOSTA, Type.WATER, Type.ROCK, [
        [ Biome.BEACH, BiomePoolTier.COMMON ],
        [ Biome.BEACH, BiomePoolTier.BOSS ],
        [ Biome.SEA, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.ARCHEN, Type.ROCK, Type.FLYING, [
        [ Biome.RUINS, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.ARCHEOPS, Type.ROCK, Type.FLYING, [
        [ Biome.RUINS, BiomePoolTier.SUPER_RARE ],
        [ Biome.RUINS, BiomePoolTier.BOSS_RARE ]
      ]
    ],
    [ Species.TRUBBISH, Type.POISON, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GARBODOR, Type.POISON, -1, [
        [ Biome.CITY, BiomePoolTier.COMMON ],
        [ Biome.CITY, BiomePoolTier.BOSS ]
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
        [ Biome.SPACE, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.DUOSION, Type.PSYCHIC, -1, [
        [ Biome.SPACE, BiomePoolTier.RARE ]
      ]
    ],
    [ Species.REUNICLUS, Type.PSYCHIC, -1, [
        [ Biome.SPACE, BiomePoolTier.RARE ],
        [ Biome.SPACE, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.AMOONGUSS, Type.GRASS, Type.POISON, [
        [ Biome.GRASS, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.COMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.GALVANTULA, Type.BUG, Type.ELECTRIC, [
        [ Biome.FOREST, BiomePoolTier.UNCOMMON ],
        [ Biome.FOREST, BiomePoolTier.BOSS ]
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
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.KLANG, Type.STEEL, -1, [
        [ Biome.FACTORY, BiomePoolTier.COMMON ],
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
      ]
    ],
    [ Species.KLINKLANG, Type.STEEL, -1, [
        [ Biome.FACTORY, BiomePoolTier.COMMON ],
        [ Biome.FACTORY, BiomePoolTier.BOSS ],
        [ Biome.RUINS, BiomePoolTier.UNCOMMON ]
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
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LAMPENT, Type.GHOST, Type.FIRE, [
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
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
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.GOLURK, Type.GROUND, Type.GHOST, [
        [ Biome.GRAVEYARD, BiomePoolTier.COMMON ],
        [ Biome.GRAVEYARD, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.PAWNIARD, Type.DARK, Type.STEEL, [
        [ Biome.ABYSS, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.BISHARP, Type.DARK, Type.STEEL, [
        [ Biome.ABYSS, BiomePoolTier.COMMON ],
        [ Biome.ABYSS, BiomePoolTier.BOSS ]
      ]
    ],
    [ Species.BOUFFALANT, Type.NORMAL, -1, [
        [ Biome.PLAINS, BiomePoolTier.RARE ],
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
        [ Biome.ABYSS, BiomePoolTier.BOSS ],
        [ Biome.END, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.LARVESTA, Type.BUG, Type.FIRE, [
        [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.VOLCARONA, Type.BUG, Type.FIRE, [
        [ Biome.VOLCANO, BiomePoolTier.SUPER_RARE ],
        [ Biome.VOLCANO, BiomePoolTier.BOSS_RARE ],
        [ Biome.END, BiomePoolTier.COMMON ]
      ]
    ],
    [ Species.COBALION, Type.STEEL, Type.FIGHTING, [
        [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.TERRAKION, Type.ROCK, Type.FIGHTING, [
        [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
      ]
    ],
    [ Species.VIRIZION, Type.GRASS, Type.FIGHTING, [
        [ Biome.DOJO, BiomePoolTier.ULTRA_RARE ],
        [ Biome.DOJO, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.LAND, BiomePoolTier.ULTRA_RARE ],
        [ Biome.LAND, BiomePoolTier.BOSS_SUPER_RARE ]
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
        [ Biome.FACTORY, BiomePoolTier.BOSS_SUPER_RARE ],
        [ Biome.END, BiomePoolTier.SUPER_RARE ]
      ]
    ],
    [ Species.ETERNATUS, Type.POISON, Type.DRAGON, [
        [ Biome.END, BiomePoolTier.BOSS ]
      ]
    ]
  ];

  for (let biome of Utils.getEnumValues(Biome)) {
    biomePools[biome] = {};

    for (let tier of Utils.getEnumValues(BiomePoolTier))
      biomePools[biome][tier] = [];
  }

  for (let pb of pokemonBiomes) {
    const speciesId = pb[0] as Species;
    const biomeEntries = pb[3] as (Biome | BiomePoolTier)[][];

    const speciesEvolutions: SpeciesEvolution[] = pokemonEvolutions.hasOwnProperty(speciesId)
      ? pokemonEvolutions[speciesId]
      : [];

    for (let b of biomeEntries) {
      const biome = b[0];
      const tier = b[1];

      if (!biomePools.hasOwnProperty(biome) || !biomePools[biome].hasOwnProperty(tier))
        continue;

      const biomeTierPool = biomePools[biome][tier];

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

  for (let b of Object.keys(biomePools)) {
    for (let t of Object.keys(biomePools[b])) {
      const tier = parseInt(t) as BiomePoolTier;
      const biomeTierPool = biomePools[b][t];
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

  function outputPools() {
    const output = {};

    for (let b of Object.keys(biomePools)) {
      const biome = Biome[b];
      output[biome] = {};
      for (let t of Object.keys(biomePools[b])) {
        const tier = BiomePoolTier[t];

        output[biome][tier] = [];

        for (let f of biomePools[b][t]) {
          if (typeof f === 'number')
            output[biome][tier].push(Species[f]);
          else {
            const tree = {};

            for (let l of Object.keys(f)) {
              tree[l] = f[l].map(s => Species[s]);
            }

            output[biome][tier].push(tree);
          }
        }
      }
    }

    console.log(beautify(output, null, 2, 180).replace(/(      |      (?:\{ "\d+": \[ )?|    "(?:.*?)": \[ |, (?:(?:\{ )?"\d+": \[ )?)"(.*?)"/g, '$1Species.$2').replace(/"(\d+)": /g, '$1: ').replace(/(    )"(.*?)"/g, '$1[BiomePoolTier.$2]').replace(/(  )"(.*?)"/g, '$1[Biome.$2]'));
  }

  outputPools();

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
          pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], BiomePoolTier[BiomePoolTier] ]);
      } else if (biomePoolPredicates[b](pokemon)) {
        pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], BiomePoolTier[BiomePoolTier.COMMON] ]);
      }
    }
  }

  console.log(JSON.stringify(pokemonBiomes, null, '  '));*/
}