import { BiomeId } from "#enums/biome-id";
import { BiomePoolTier } from "#enums/biome-pool-tier";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import type { BiomeLinks, BiomePokemonPools, BiomeTrainerPools } from "#types/biomes";

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

export const biomePokemonPools: BiomePokemonPools = {
  [BiomeId.TOWN]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.CATERPIE,
        SpeciesId.SENTRET,
        SpeciesId.LEDYBA,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        SpeciesId.SCATTERBUG,
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.CATERPIE,
        SpeciesId.SENTRET,
        SpeciesId.HOPPIP,
        SpeciesId.SUNKERN,
        SpeciesId.SILCOON,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.COTTONEE,
        SpeciesId.SCATTERBUG,
        SpeciesId.YUNGOOS,
        SpeciesId.SKWOVET
      ],
      [TimeOfDay.DUSK]: [ SpeciesId.WEEDLE, SpeciesId.POOCHYENA, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
      [TimeOfDay.NIGHT]: [ SpeciesId.WEEDLE, SpeciesId.HOOTHOOT, SpeciesId.SPINARAK, SpeciesId.POOCHYENA, SpeciesId.CASCOON, SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.BLIPBUG ],
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
      [TimeOfDay.DAWN]: [ SpeciesId.SENTRET, SpeciesId.YUNGOOS, SpeciesId.SKWOVET ],
      [TimeOfDay.DAY]: [ SpeciesId.SENTRET, SpeciesId.YUNGOOS, SpeciesId.SKWOVET ],
      [TimeOfDay.DUSK]: [ SpeciesId.MEOWTH, SpeciesId.POOCHYENA ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ZUBAT, SpeciesId.MEOWTH, SpeciesId.POOCHYENA ],
      [TimeOfDay.ALL]: [ SpeciesId.ZIGZAGOON, SpeciesId.BIDOOF, SpeciesId.LECHONK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.DODUO,
        SpeciesId.POOCHYENA,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.PAWMI
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.DODUO,
        SpeciesId.POOCHYENA,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.ROCKRUFF,
        SpeciesId.PAWMI
      ],
      [TimeOfDay.DUSK]: [ SpeciesId.MANKEY ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MANKEY ],
      [TimeOfDay.ALL]: [
        SpeciesId.PIDGEY,
        SpeciesId.SPEAROW,
        SpeciesId.PIKACHU,
        SpeciesId.FLETCHLING
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DAY]: [ SpeciesId.PALDEA_TAUROS ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHINX ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHINX ],
      [TimeOfDay.ALL]: [ SpeciesId.ABRA, SpeciesId.BUNEARY, SpeciesId.ROOKIDEE ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FARFETCHD, SpeciesId.LICKITUNG, SpeciesId.CHANSEY, SpeciesId.EEVEE, SpeciesId.SNORLAX, SpeciesId.DUNSPARCE ] },
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
      [TimeOfDay.DAWN]: [ SpeciesId.HOPPIP, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DAY]: [ SpeciesId.HOPPIP, SpeciesId.SUNKERN, SpeciesId.COTTONEE, SpeciesId.PETILIL ],
      [TimeOfDay.DUSK]: [ SpeciesId.SEEDOT, SpeciesId.SHROOMISH ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SEEDOT, SpeciesId.SHROOMISH ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.COMBEE, SpeciesId.CHERUBI ],
      [TimeOfDay.DAY]: [ SpeciesId.COMBEE, SpeciesId.CHERUBI ],
      [TimeOfDay.DUSK]: [ SpeciesId.FOONGUS ],
      [TimeOfDay.NIGHT]: [ SpeciesId.FOONGUS ],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.BULBASAUR, SpeciesId.GROWLITHE, SpeciesId.TURTWIG ]
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
      [TimeOfDay.DAWN]: [ SpeciesId.BOUNSWEET ],
      [TimeOfDay.DAY]: [ SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_M, SpeciesId.BOUNSWEET ],
      [TimeOfDay.DUSK]: [ SpeciesId.ODDISH, SpeciesId.KRICKETOT ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ODDISH, SpeciesId.KRICKETOT ],
      [TimeOfDay.ALL]: [ SpeciesId.NINCADA, SpeciesId.FOMANTIS, SpeciesId.NYMBLE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.PARAS, SpeciesId.VENONAT, SpeciesId.SPINARAK ],
      [TimeOfDay.ALL]: [ SpeciesId.VULPIX ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.PINSIR, SpeciesId.CHIKORITA, SpeciesId.GIRAFARIG, SpeciesId.ZANGOOSE, SpeciesId.KECLEON, SpeciesId.TROPIUS ]
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
      [TimeOfDay.DAWN]: [ SpeciesId.YAMPER ],
      [TimeOfDay.DAY]: [ SpeciesId.YAMPER ],
      [TimeOfDay.DUSK]: [ SpeciesId.PATRAT ],
      [TimeOfDay.NIGHT]: [ SpeciesId.HOUNDOUR, SpeciesId.PATRAT ],
      [TimeOfDay.ALL]: [ SpeciesId.RATTATA, SpeciesId.ZIGZAGOON, SpeciesId.LILLIPUP ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.PATRAT, SpeciesId.INDEEDEE ],
      [TimeOfDay.DAY]: [ SpeciesId.PATRAT, SpeciesId.INDEEDEE ],
      [TimeOfDay.DUSK]: [ SpeciesId.ESPURR ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ESPURR ],
      [TimeOfDay.ALL]: [ SpeciesId.PIKACHU, SpeciesId.GLAMEOW, SpeciesId.FURFROU, SpeciesId.FIDOUGH, SpeciesId.SQUAWKABILLY ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.TANDEMAUS ],
      [TimeOfDay.DAY]: [ SpeciesId.TANDEMAUS ],
      [TimeOfDay.DUSK]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MORPEKO ],
      [TimeOfDay.ALL]: [ SpeciesId.VAROOM ]
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
        SpeciesId.BELLSPROUT,
        SpeciesId.COMBEE,
        SpeciesId.PETILIL,
        SpeciesId.DEERLING,
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.BUTTERFREE,
        SpeciesId.BELLSPROUT,
        SpeciesId.BEAUTIFLY,
        SpeciesId.COMBEE,
        SpeciesId.PETILIL,
        SpeciesId.DEERLING,
        SpeciesId.VIVILLON
      ],
      [TimeOfDay.DUSK]: [
        SpeciesId.BEEDRILL,
        SpeciesId.PINECO,
        SpeciesId.SEEDOT,
        SpeciesId.SHROOMISH,
        SpeciesId.VENIPEDE
      ],
      [TimeOfDay.NIGHT]: [
        SpeciesId.BEEDRILL,
        SpeciesId.VENONAT,
        SpeciesId.SPINARAK,
        SpeciesId.PINECO,
        SpeciesId.DUSTOX,
        SpeciesId.SEEDOT,
        SpeciesId.SHROOMISH,
        SpeciesId.VENIPEDE
      ],
      [TimeOfDay.ALL]: [ SpeciesId.TAROUNTULA, SpeciesId.NYMBLE, SpeciesId.SHROODLE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, SpeciesId.SEWADDLE ],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.MOTHIM, SpeciesId.SEWADDLE ],
      [TimeOfDay.DUSK]: [ SpeciesId.SPINARAK, SpeciesId.DOTTLER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.HOOTHOOT, SpeciesId.ROCKRUFF, SpeciesId.DOTTLER ],
      [TimeOfDay.ALL]: [
        SpeciesId.EKANS,
        SpeciesId.TEDDIURSA,
        SpeciesId.BURMY,
        SpeciesId.PANSAGE
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SCYTHER ],
      [TimeOfDay.ALL]: [
        SpeciesId.HERACROSS,
        SpeciesId.TREECKO,
        SpeciesId.TROPIUS,
        SpeciesId.KARRABLAST,
        SpeciesId.SHELMET,
        SpeciesId.CHESPIN,
        SpeciesId.ROWLET,
        SpeciesId.SQUAWKABILLY,
        SpeciesId.TOEDSCOOL
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
      [TimeOfDay.DAWN]: [ SpeciesId.SLOWPOKE, SpeciesId.WINGULL, SpeciesId.CRAMORANT, SpeciesId.FINIZEN ],
      [TimeOfDay.DAY]: [ SpeciesId.SLOWPOKE, SpeciesId.WINGULL, SpeciesId.CRAMORANT, SpeciesId.FINIZEN ],
      [TimeOfDay.DUSK]: [ SpeciesId.INKAY ],
      [TimeOfDay.NIGHT]: [ SpeciesId.FINNEON, SpeciesId.INKAY ],
      [TimeOfDay.ALL]: [ SpeciesId.TENTACOOL, SpeciesId.MAGIKARP, SpeciesId.BUIZEL ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.STARYU ],
      [TimeOfDay.DAY]: [ SpeciesId.STARYU ],
      [TimeOfDay.DUSK]: [ SpeciesId.SLOWPOKE, SpeciesId.SHELLDER, SpeciesId.CARVANHA ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SLOWPOKE, SpeciesId.SHELLDER, SpeciesId.CHINCHOU, SpeciesId.CARVANHA ],
      [TimeOfDay.ALL]: [
        SpeciesId.POLIWAG,
        SpeciesId.HORSEA,
        SpeciesId.GOLDEEN,
        SpeciesId.WAILMER,
        SpeciesId.PANPOUR,
        SpeciesId.WATTREL
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.LAPRAS, SpeciesId.PIPLUP, SpeciesId.POPPLIO ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.KINGDRA, SpeciesId.ROTOM, SpeciesId.TIRTOUGA ] },
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
      [TimeOfDay.DAWN]: [ SpeciesId.WOOPER, SpeciesId.LOTAD ],
      [TimeOfDay.DAY]: [ SpeciesId.WOOPER, SpeciesId.LOTAD ],
      [TimeOfDay.DUSK]: [ SpeciesId.EKANS, SpeciesId.PALDEA_WOOPER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.EKANS, SpeciesId.PALDEA_WOOPER ],
      [TimeOfDay.ALL]: [
        SpeciesId.POLIWAG,
        SpeciesId.GULPIN,
        SpeciesId.SHELLOS,
        SpeciesId.TYMPOLE
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EKANS ],
      [TimeOfDay.DAY]: [ SpeciesId.EKANS ],
      [TimeOfDay.DUSK]: [ SpeciesId.CROAGUNK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CROAGUNK ],
      [TimeOfDay.ALL]: [
        SpeciesId.PSYDUCK,
        SpeciesId.BARBOACH,
        SpeciesId.SKORUPI,
        SpeciesId.STUNFISK,
        SpeciesId.MAREANIE
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.TOTODILE, SpeciesId.MUDKIP ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.GALAR_SLOWPOKE, SpeciesId.HISUI_SLIGGOO ],
      [TimeOfDay.DAY]: [ SpeciesId.GALAR_SLOWPOKE, SpeciesId.HISUI_SLIGGOO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.POLITOED, SpeciesId.GALAR_STUNFISK ]
    },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, SpeciesId.POIPOLE ] },
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
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AZELF, SpeciesId.POIPOLE ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.BEACH]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.STARYU ],
      [TimeOfDay.DAY]: [ SpeciesId.STARYU ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SHELLDER ],
      [TimeOfDay.ALL]: [
        SpeciesId.KRABBY,
        SpeciesId.CORPHISH,
        SpeciesId.DWEBBLE,
        SpeciesId.BINACLE,
        SpeciesId.MAREANIE,
        SpeciesId.WIGLETT
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.BURMY, SpeciesId.CLAUNCHER, SpeciesId.SANDYGAST ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.QUAXLY, SpeciesId.TATSUGIRI ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TIRTOUGA ] },
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
      [TimeOfDay.DAWN]: [ SpeciesId.LOTAD, SpeciesId.DUCKLETT ],
      [TimeOfDay.DAY]: [ SpeciesId.LOTAD, SpeciesId.DUCKLETT ],
      [TimeOfDay.DUSK]: [ SpeciesId.MARILL ],
      [TimeOfDay.NIGHT]: [ SpeciesId.MARILL ],
      [TimeOfDay.ALL]: [
        SpeciesId.PSYDUCK,
        SpeciesId.GOLDEEN,
        SpeciesId.MAGIKARP,
        SpeciesId.CHEWTLE
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.DEWPIDER ],
      [TimeOfDay.DAY]: [ SpeciesId.DEWPIDER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.SLOWPOKE, SpeciesId.WOOPER, SpeciesId.SURSKIT, SpeciesId.WISHIWASHI, SpeciesId.FLAMIGO ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.SQUIRTLE,
        SpeciesId.OSHAWOTT,
        SpeciesId.FROAKIE,
        SpeciesId.SOBBLE
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
        SpeciesId.CHINCHOU,
        SpeciesId.REMORAID,
        SpeciesId.CLAMPERL,
        SpeciesId.BASCULIN,
        SpeciesId.FRILLISH,
        SpeciesId.ARROKUDA,
        SpeciesId.VELUZA
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.TENTACOOL,
        SpeciesId.SHELLDER,
        SpeciesId.WAILMER,
        SpeciesId.LUVDISC,
        SpeciesId.SHELLOS,
        SpeciesId.SKRELP,
        SpeciesId.PINCURCHIN,
        SpeciesId.DONDOZO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.QWILFISH, SpeciesId.CORSOLA, SpeciesId.OCTILLERY, SpeciesId.MANTYKE, SpeciesId.ALOMOMOLA, SpeciesId.TYNAMO, SpeciesId.DHELMISE ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.OMANYTE,
        SpeciesId.KABUTO,
        SpeciesId.RELICANTH,
        SpeciesId.PYUKUMUKU,
        SpeciesId.GALAR_CORSOLA,
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
        SpeciesId.TAILLOW,
        SpeciesId.SWABLU,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.FLETCHLING
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.TAILLOW,
        SpeciesId.SWABLU,
        SpeciesId.STARLY,
        SpeciesId.PIDOVE,
        SpeciesId.FLETCHLING
      ],
      [TimeOfDay.DUSK]: [ SpeciesId.RHYHORN, SpeciesId.ARON, SpeciesId.ROGGENROLA ],
      [TimeOfDay.NIGHT]: [ SpeciesId.RHYHORN, SpeciesId.ARON, SpeciesId.ROGGENROLA ],
      [TimeOfDay.ALL]: [ SpeciesId.PIDGEY, SpeciesId.SPEAROW, SpeciesId.SKIDDO ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.RHYHORN,
        SpeciesId.ARON,
        SpeciesId.ROGGENROLA,
        SpeciesId.RUFFLET,
        SpeciesId.ROOKIDEE,
        SpeciesId.FLITTLE,
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.RHYHORN,
        SpeciesId.ARON,
        SpeciesId.ROGGENROLA,
        SpeciesId.RUFFLET,
        SpeciesId.ROOKIDEE,
        SpeciesId.FLITTLE,
        SpeciesId.BOMBIRDIER
      ],
      [TimeOfDay.DUSK]: [ SpeciesId.VULLABY ],
      [TimeOfDay.NIGHT]: [ SpeciesId.VULLABY ],
      [TimeOfDay.ALL]: [
        SpeciesId.MACHOP,
        SpeciesId.GEODUDE,
        SpeciesId.NATU,
        SpeciesId.SLUGMA,
        SpeciesId.NACLI
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.MURKROW ],
      [TimeOfDay.ALL]: [ SpeciesId.SKARMORY, SpeciesId.TORCHIC, SpeciesId.SPOINK, SpeciesId.HAWLUCHA, SpeciesId.KLAWF ]
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
        SpeciesId.ROTOM,
        SpeciesId.ARCHEOPS,
        SpeciesId.AXEW
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
      [TimeOfDay.DAWN]: [ SpeciesId.PHANPY ],
      [TimeOfDay.DAY]: [ SpeciesId.PHANPY ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.CUBONE ],
      [TimeOfDay.ALL]: [
        SpeciesId.DIGLETT,
        SpeciesId.GEODUDE,
        SpeciesId.RHYHORN,
        SpeciesId.DRILBUR,
        SpeciesId.MUDBRAY
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SIZZLIPEDE, SpeciesId.CAPSAKID ],
      [TimeOfDay.DAY]: [ SpeciesId.SIZZLIPEDE, SpeciesId.CAPSAKID ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.SANDSHREW,
        SpeciesId.NUMEL,
        SpeciesId.ROGGENROLA,
        SpeciesId.CUFANT
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.GLIGAR, SpeciesId.POLTCHAGEIST ] },
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
        SpeciesId.ZUBAT,
        SpeciesId.PARAS,
        SpeciesId.TEDDIURSA,
        SpeciesId.WHISMUR,
        SpeciesId.ROGGENROLA,
        SpeciesId.WOOBAT,
        SpeciesId.BUNNELBY,
        SpeciesId.NACLI
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.ROCKRUFF ],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.GEODUDE,
        SpeciesId.MAKUHITA,
        SpeciesId.NOSEPASS,
        SpeciesId.NOIBAT,
        SpeciesId.WIMPOD
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.FERROSEED, SpeciesId.CARBINK, SpeciesId.GLIMMET ]
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
      [TimeOfDay.DAWN]: [ SpeciesId.TRAPINCH, SpeciesId.HIPPOPOTAS, SpeciesId.RELLOR ],
      [TimeOfDay.DAY]: [ SpeciesId.TRAPINCH, SpeciesId.HIPPOPOTAS, SpeciesId.RELLOR ],
      [TimeOfDay.DUSK]: [ SpeciesId.CACNEA, SpeciesId.SANDILE ],
      [TimeOfDay.NIGHT]: [ SpeciesId.CACNEA, SpeciesId.SANDILE ],
      [TimeOfDay.ALL]: [ SpeciesId.SANDSHREW, SpeciesId.SKORUPI, SpeciesId.SILICOBRA ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SANDILE, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DAY]: [ SpeciesId.SANDILE, SpeciesId.HELIOPTILE ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.MARACTUS, SpeciesId.BRAMBLIN, SpeciesId.ORTHWORM ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.VIBRAVA ],
      [TimeOfDay.DAY]: [ SpeciesId.VIBRAVA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DARUMAKA ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.LILEEP, SpeciesId.ANORITH ] },
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
        SpeciesId.SEEL,
        SpeciesId.SWINUB,
        SpeciesId.SNOVER,
        SpeciesId.VANILLITE,
        SpeciesId.CUBCHOO,
        SpeciesId.BERGMITE,
        SpeciesId.CRABRAWLER,
        SpeciesId.SNOM
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.SNEASEL,
        SpeciesId.SNORUNT,
        SpeciesId.SPHEAL,
        SpeciesId.EISCUE,
        SpeciesId.CETODDLE
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.JYNX, SpeciesId.LAPRAS, SpeciesId.FROSLASS, SpeciesId.CRYOGONAL ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, SpeciesId.ROTOM, SpeciesId.AMAURA ] },
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
      [TimeOfDay.DAWN]: [ SpeciesId.LEDYBA, SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DAY]: [ SpeciesId.ROSELIA, SpeciesId.COTTONEE, SpeciesId.MINCCINO ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.BLITZLE,
        SpeciesId.FLABEBE,
        SpeciesId.CUTIEFLY,
        SpeciesId.GOSSIFLEUR,
        SpeciesId.WOOLOO
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [
        SpeciesId.PONYTA,
        SpeciesId.SNUBBULL,
        SpeciesId.SKITTY,
        SpeciesId.BOUFFALANT,
        SpeciesId.SMOLIV
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.PONYTA,
        SpeciesId.SNUBBULL,
        SpeciesId.SKITTY,
        SpeciesId.BOUFFALANT,
        SpeciesId.SMOLIV
      ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.JIGGLYPUFF,
        SpeciesId.MAREEP,
        SpeciesId.RALTS,
        SpeciesId.GLAMEOW,
        SpeciesId.ORICORIO
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [ SpeciesId.VOLBEAT, SpeciesId.ILLUMISE ],
      [TimeOfDay.ALL]: [ SpeciesId.TAUROS, SpeciesId.EEVEE, SpeciesId.MILTANK, SpeciesId.SPINDA, SpeciesId.APPLIN, SpeciesId.SPRIGATITO ]
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
        SpeciesId.MAGNEMITE,
        SpeciesId.VOLTORB,
        SpeciesId.ELECTRIKE,
        SpeciesId.SHINX,
        SpeciesId.DEDENNE,
        SpeciesId.GRUBBIN,
        SpeciesId.PAWMI,
        SpeciesId.TADBULB
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ELECTABUZZ, SpeciesId.PLUSLE, SpeciesId.MINUN, SpeciesId.PACHIRISU, SpeciesId.EMOLGA, SpeciesId.TOGEDEMARU ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MAREEP ] },
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
        SpeciesId.PONYTA,
        SpeciesId.SLUGMA,
        SpeciesId.NUMEL,
        SpeciesId.SALANDIT,
        SpeciesId.ROLYCOLY
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MAGMAR, SpeciesId.TORKOAL, SpeciesId.PANSEAR, SpeciesId.HEATMOR, SpeciesId.TURTONATOR ] },
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
        SpeciesId.CHARCADET
      ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.FLAREON, SpeciesId.ROTOM, SpeciesId.LARVESTA, SpeciesId.HISUI_GROWLITHE ] },
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
        SpeciesId.GASTLY,
        SpeciesId.SHUPPET,
        SpeciesId.DUSKULL,
        SpeciesId.DRIFLOON,
        SpeciesId.LITWICK,
        SpeciesId.PHANTUMP,
        SpeciesId.PUMPKABOO,
        SpeciesId.GREAVARD
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.CUBONE, SpeciesId.YAMASK, SpeciesId.SINISTEA ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MISDREAVUS, SpeciesId.MIMIKYU, SpeciesId.FUECOCO, SpeciesId.CERULEDGE ] },
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
        SpeciesId.MANKEY,
        SpeciesId.MAKUHITA,
        SpeciesId.MEDITITE,
        SpeciesId.STUFFUL,
        SpeciesId.CLOBBOPUS
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.CROAGUNK, SpeciesId.SCRAGGY, SpeciesId.MIENFOO ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.LUCARIO, SpeciesId.THROH, SpeciesId.SAWK, SpeciesId.PANCHAM ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.GALAR_FARFETCHD ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, SpeciesId.KUBFU, SpeciesId.GALAR_ZAPDOS ] },
    [BiomePoolTier.BOSS]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.HARIYAMA, SpeciesId.MEDICHAM, SpeciesId.LUCARIO, SpeciesId.TOXICROAK, SpeciesId.THROH, SpeciesId.SAWK, SpeciesId.SCRAFTY, SpeciesId.MIENSHAO, SpeciesId.BEWEAR, SpeciesId.GRAPPLOCT, SpeciesId.ANNIHILAPE ]
    },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.HITMONTOP, SpeciesId.GALLADE, SpeciesId.PANGORO, SpeciesId.SIRFETCHD, SpeciesId.HISUI_DECIDUEYE ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TERRAKION, SpeciesId.KUBFU ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ZAMAZENTA, SpeciesId.GALAR_ZAPDOS ] }
  },
  [BiomeId.FACTORY]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.MACHOP,
        SpeciesId.MAGNEMITE,
        SpeciesId.VOLTORB,
        SpeciesId.TIMBURR,
        SpeciesId.KLINK
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BRONZOR, SpeciesId.KLEFKI ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PORYGON ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BELDUM ] },
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
        SpeciesId.DROWZEE,
        SpeciesId.NATU,
        SpeciesId.UNOWN,
        SpeciesId.SPOINK,
        SpeciesId.BALTOY,
        SpeciesId.ELGYEM
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ABRA, SpeciesId.SIGILYPH, SpeciesId.TINKATINK ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MR_MIME, SpeciesId.WOBBUFFET, SpeciesId.GOTHITA, SpeciesId.STONJOURNER ] },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [ SpeciesId.ESPEON ],
      [TimeOfDay.DUSK]: [ SpeciesId.GALAR_YAMASK ],
      [TimeOfDay.NIGHT]: [ SpeciesId.GALAR_YAMASK ],
      [TimeOfDay.ALL]: [ SpeciesId.ARCHEN ]
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
        SpeciesId.BAGON,
        SpeciesId.GOOMY,
        SpeciesId.JANGMO_O
      ],
      [TimeOfDay.DAY]: [
        SpeciesId.BAGON,
        SpeciesId.GOODRA, // specifically goodra so not hisui
        SpeciesId.JANGMO_O
      ],
      [TimeOfDay.DUSK]: [ SpeciesId.LARVITAR ],
      [TimeOfDay.NIGHT]: [ SpeciesId.LARVITAR ],
      [TimeOfDay.ALL]: [
        SpeciesId.VIBRAVA,
        SpeciesId.GIBLE,
        SpeciesId.AXEW
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.DEINO ],
      [TimeOfDay.NIGHT]: [ SpeciesId.DEINO ],
      [TimeOfDay.ALL]: [ SpeciesId.SWABLU, SpeciesId.DRAMPA, SpeciesId.CYCLIZAR ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.DREEPY ],
      [TimeOfDay.NIGHT]: [ SpeciesId.DREEPY ],
      [TimeOfDay.ALL]: [ SpeciesId.DRATINI, SpeciesId.FRIGIBAX ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.AERODACTYL, SpeciesId.DRUDDIGON, SpeciesId.TYRUNT, SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH ] },
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
        SpeciesId.HOUNDOUR,
        SpeciesId.SABLEYE,
        SpeciesId.PURRLOIN,
        SpeciesId.PAWNIARD,
        SpeciesId.NICKIT,
        SpeciesId.IMPIDIMP,
        SpeciesId.MASCHIFF
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.ABSOL, SpeciesId.SPIRITOMB, SpeciesId.ZORUA, SpeciesId.DEINO ]
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
      [TimeOfDay.ALL]: [ SpeciesId.CLEFAIRY, SpeciesId.BRONZOR, SpeciesId.MUNNA, SpeciesId.MINIOR ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.BALTOY, SpeciesId.ELGYEM ] },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.BELDUM, SpeciesId.SIGILYPH, SpeciesId.SOLOSIS ]
    },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.PORYGON ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COSMOG, SpeciesId.CELESTEELA ] },
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
        SpeciesId.MACHOP,
        SpeciesId.MAGNEMITE,
        SpeciesId.DRILBUR,
        SpeciesId.TIMBURR
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.GRIMER,
        SpeciesId.KOFFING,
        SpeciesId.RHYHORN,
        SpeciesId.SCRAGGY
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.GALAR_MEOWTH ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ONIX, SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.DURALUDON ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.HITMONTOP ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MACHAMP, SpeciesId.CONKELDURR ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [ SpeciesId.PERRSERKER ], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ARCHALUDON ] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.COBALION, SpeciesId.STAKATAKA ] },
    [BiomePoolTier.BOSS_ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] }
  },
  [BiomeId.JUNGLE]: {
    [BiomePoolTier.COMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.VESPIQUEN, SpeciesId.CHERUBI, SpeciesId.SEWADDLE ],
      [TimeOfDay.DAY]: [ SpeciesId.VESPIQUEN, SpeciesId.CHERUBI, SpeciesId.SEWADDLE ],
      [TimeOfDay.DUSK]: [ SpeciesId.SHROOMISH, SpeciesId.PURRLOIN, SpeciesId.FOONGUS ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SPINARAK, SpeciesId.SHROOMISH, SpeciesId.PURRLOIN, SpeciesId.FOONGUS ],
      [TimeOfDay.ALL]: [ SpeciesId.AIPOM, SpeciesId.BLITZLE, SpeciesId.PIKIPEK ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DAY]: [ SpeciesId.EXEGGCUTE, SpeciesId.TROPIUS, SpeciesId.COMBEE, SpeciesId.KOMALA ],
      [TimeOfDay.DUSK]: [ SpeciesId.TANGELA, SpeciesId.SPINARAK, SpeciesId.PANCHAM ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TANGELA, SpeciesId.PANCHAM ],
      [TimeOfDay.ALL]: [
        SpeciesId.PANSAGE,
        SpeciesId.PANSEAR,
        SpeciesId.PANPOUR,
        SpeciesId.JOLTIK,
        SpeciesId.LITLEO,
        SpeciesId.FOMANTIS,
        SpeciesId.FALINKS
      ]
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.FOONGUS, SpeciesId.PASSIMIAN, SpeciesId.GALAR_PONYTA ],
      [TimeOfDay.DAY]: [ SpeciesId.FOONGUS, SpeciesId.PASSIMIAN ],
      [TimeOfDay.DUSK]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ORANGURU ],
      [TimeOfDay.ALL]: [
        SpeciesId.SCYTHER,
        SpeciesId.YANMA,
        SpeciesId.SLAKOTH,
        SpeciesId.SEVIPER,
        SpeciesId.CARNIVINE,
        SpeciesId.SNIVY,
        SpeciesId.GROOKEY
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
        SpeciesId.JIGGLYPUFF,
        SpeciesId.MARILL,
        SpeciesId.SPRITZEE,
        SpeciesId.SWIRLIX,
        SpeciesId.CUTIEFLY,
        SpeciesId.MORELULL,
        SpeciesId.MILCERY,
        SpeciesId.MAWILE,
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
        SpeciesId.RALTS,
        SpeciesId.CARBINK,
        SpeciesId.COMFEY,
        SpeciesId.HATENNA
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
        SpeciesId.GASTLY,
        SpeciesId.NATU,
        SpeciesId.DUSKULL,
        SpeciesId.YAMASK,
        SpeciesId.GOLETT,
        SpeciesId.HONEDGE,
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [
        SpeciesId.CUBONE,
        SpeciesId.BALTOY,
        SpeciesId.CHINGLING,
        SpeciesId.SKORUPI,
        SpeciesId.LITWICK,
      ]
    },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [SpeciesId.GIMMIGHOUL] },
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
      [TimeOfDay.DUSK]: [ SpeciesId.PATRAT ],
      [TimeOfDay.NIGHT]: [ SpeciesId.PATRAT ],
      [TimeOfDay.ALL]: [
        SpeciesId.RATTATA,
        SpeciesId.GRIMER,
        SpeciesId.KOFFING,
        SpeciesId.TRUBBISH,
      ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.STUNKY ],
      [TimeOfDay.NIGHT]: [ SpeciesId.STUNKY ],
      [TimeOfDay.ALL]: [ SpeciesId.WORMADAM ],
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [],
      [TimeOfDay.DAY]: [],
      [TimeOfDay.DUSK]: [ SpeciesId.TOXTRICITY, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.NIGHT]: [ SpeciesId.TOXTRICITY, SpeciesId.GALAR_ZIGZAGOON ],
      [TimeOfDay.ALL]: [ SpeciesId.VAROOM  ]
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
      [TimeOfDay.DUSK]: [ SpeciesId.SNEASEL, SpeciesId.TEDDIURSA, SpeciesId.SNOM ],
      [TimeOfDay.NIGHT]: [ SpeciesId.SNEASEL, SpeciesId.TEDDIURSA, SpeciesId.SNOM ],
      [TimeOfDay.ALL]: [SpeciesId.PILOSWINE, SpeciesId.SNOVER, SpeciesId.EISCUE ]
    },
    [BiomePoolTier.UNCOMMON]: {
      [TimeOfDay.DAWN]: [ SpeciesId.SNEASEL, SpeciesId.TEDDIURSA, SpeciesId.STANTLER ],
      [TimeOfDay.DAY]: [ SpeciesId.SNEASEL, SpeciesId.TEDDIURSA, SpeciesId.STANTLER ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: []
    },
    [BiomePoolTier.RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.GALAR_DARUMAKA ],
      [TimeOfDay.DAY]: [ SpeciesId.GALAR_DARUMAKA ],
      [TimeOfDay.DUSK]: [],
      [TimeOfDay.NIGHT]: [],
      [TimeOfDay.ALL]: [ SpeciesId.DELIBIRD, SpeciesId.ALOLA_SANDSHREW, SpeciesId.ALOLA_VULPIX ]
    },
    [BiomePoolTier.SUPER_RARE]: {
      [TimeOfDay.DAWN]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DAY]: [ SpeciesId.HISUI_SNEASEL ],
      [TimeOfDay.DUSK]: [ SpeciesId.HISUI_ZORUA ],
      [TimeOfDay.NIGHT]: [ SpeciesId.HISUI_ZORUA ],
      [TimeOfDay.ALL]: [ SpeciesId.GALAR_MR_MIME, SpeciesId.ARCTOZOLT, SpeciesId.HISUI_AVALUGG ]
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
      [TimeOfDay.DUSK]: [ SpeciesId.ALOLA_RATTATA, SpeciesId.ALOLA_MEOWTH ],
      [TimeOfDay.NIGHT]: [ SpeciesId.ALOLA_RATTATA, SpeciesId.ALOLA_MEOWTH ],
      [TimeOfDay.ALL]: [
        SpeciesId.ORICORIO,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_VULPIX,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_GRIMER,
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
        SpeciesId.MAGNEMITE,
        SpeciesId.GRIMER,
        SpeciesId.VOLTORB,
        SpeciesId.BRONZOR,
        SpeciesId.KLINK,
      ]
    },
    [BiomePoolTier.UNCOMMON]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.SOLOSIS ] },
    [BiomePoolTier.RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.DITTO, SpeciesId.PORYGON ] },
    [BiomePoolTier.SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM ] },
    [BiomePoolTier.ULTRA_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.TYPE_NULL ] },
    [BiomePoolTier.BOSS]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.MUK, SpeciesId.ELECTRODE, SpeciesId.BRONZONG, SpeciesId.MAGNEZONE, SpeciesId.PORYGON_Z, SpeciesId.REUNICLUS, SpeciesId.KLINKLANG ] },
    [BiomePoolTier.BOSS_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [] },
    [BiomePoolTier.BOSS_SUPER_RARE]: { [TimeOfDay.DAWN]: [], [TimeOfDay.DAY]: [], [TimeOfDay.DUSK]: [], [TimeOfDay.NIGHT]: [], [TimeOfDay.ALL]: [ SpeciesId.ROTOM, SpeciesId.ZYGARDE, SpeciesId.TYPE_NULL ] },
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
