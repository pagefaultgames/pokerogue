import { SpeciesId } from "#enums/species-id";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { TrainerType } from "#enums/trainer-type";
import { nextTrainerId, setTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { getEvilGruntPartyTemplate } from "#trainers/trainer-party-template";
import { TrainerConfigs } from "#types/trainer-funcs";

export const evilGruntTrainerConfig: TrainerConfigs = {
// Johto And Kanto Grunts
    [TrainerType.ROCKET_GRUNT]: new TrainerConfig(setTrainerId(TrainerType.ROCKET_GRUNT))
      .setHasGenders("Rocket Grunt Female")
      .setHasDouble("Rocket Grunts")
      .setMoneyMultiplier(1.0)
      .setEncounterBgm(TrainerType.PLASMA_GRUNT)
      .setBattleBgm("battle_plasma_grunt")
      .setMixedBattleBgm("battle_rocket_grunt")
      .setVictoryBgm("victory_team_plasma")
      .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
      .setSpeciesPools({
        [TrainerPoolTier.COMMON]: [
          SpeciesId.WEEDLE,
          SpeciesId.RATTATA,
          SpeciesId.EKANS,
          SpeciesId.SANDSHREW,
          SpeciesId.ZUBAT,
          SpeciesId.ODDISH,
          SpeciesId.GEODUDE,
          SpeciesId.SLOWPOKE,
          SpeciesId.GRIMER,
          SpeciesId.KOFFING,
        ],
        [TrainerPoolTier.UNCOMMON]: [
          SpeciesId.MANKEY,
          SpeciesId.GROWLITHE,
          SpeciesId.MAGNEMITE,
          SpeciesId.ONIX,
          SpeciesId.VOLTORB,
          SpeciesId.EXEGGCUTE,
          SpeciesId.CUBONE,
          SpeciesId.LICKITUNG,
          SpeciesId.TAUROS,
          SpeciesId.MAGIKARP,
          SpeciesId.MURKROW,
          SpeciesId.ELEKID,
          SpeciesId.MAGBY,
        ],
        [TrainerPoolTier.RARE]: [
          SpeciesId.ABRA,
          SpeciesId.GASTLY,
          SpeciesId.SCYTHER,
          SpeciesId.PORYGON,
          SpeciesId.OMANYTE,
          SpeciesId.KABUTO,
          SpeciesId.ALOLA_RATTATA,
          SpeciesId.ALOLA_SANDSHREW,
          SpeciesId.ALOLA_MEOWTH,
          SpeciesId.ALOLA_GEODUDE,
          SpeciesId.ALOLA_GRIMER,
          SpeciesId.PALDEA_TAUROS,
        ],
        [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DRATINI, SpeciesId.LARVITAR],
      }),
// Hoenn Grunts
    [TrainerType.MAGMA_GRUNT]: new TrainerConfig(nextTrainerId())
      .setHasGenders("Magma Grunt Female")
      .setHasDouble("Magma Grunts")
      .setMoneyMultiplier(1.0)
      .setEncounterBgm(TrainerType.PLASMA_GRUNT)
      .setBattleBgm("battle_plasma_grunt")
      .setMixedBattleBgm("battle_aqua_magma_grunt")
      .setVictoryBgm("victory_team_plasma")
      .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
      .setSpeciesPools({
        [TrainerPoolTier.COMMON]: [
          SpeciesId.DIGLETT,
          SpeciesId.GROWLITHE,
          SpeciesId.SLUGMA,
          SpeciesId.POOCHYENA,
          SpeciesId.ZIGZAGOON,
          SpeciesId.NUMEL,
          SpeciesId.TORKOAL,
          SpeciesId.BALTOY,
        ],
        [TrainerPoolTier.UNCOMMON]: [
          SpeciesId.RHYHORN,
          SpeciesId.PHANPY,
          SpeciesId.MAGBY,
          SpeciesId.ZANGOOSE,
          SpeciesId.SOLROCK,
          SpeciesId.HEATMOR,
          SpeciesId.ROLYCOLY,
          SpeciesId.CAPSAKID,
        ],
        [TrainerPoolTier.RARE]: [
          SpeciesId.TRAPINCH,
          SpeciesId.LILEEP,
          SpeciesId.ANORITH,
          SpeciesId.GOLETT,
          SpeciesId.TURTONATOR,
          SpeciesId.TOEDSCOOL,
          SpeciesId.HISUI_GROWLITHE,
        ],
        [TrainerPoolTier.SUPER_RARE]: [SpeciesId.CHARCADET, SpeciesId.ARON],
      }),
  [TrainerType.AQUA_GRUNT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Aqua Grunt Female")
    .setHasDouble("Aqua Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.QWILFISH,
        SpeciesId.REMORAID,
        SpeciesId.ZIGZAGOON,
        SpeciesId.LOTAD,
        SpeciesId.WINGULL,
        SpeciesId.CARVANHA,
        SpeciesId.WAILMER,
        SpeciesId.BARBOACH,
        SpeciesId.CORPHISH,
        SpeciesId.SPHEAL,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.TENTACOOL,
        SpeciesId.HORSEA,
        SpeciesId.CHINCHOU,
        SpeciesId.WOOPER,
        SpeciesId.AZURILL,
        SpeciesId.SEVIPER,
        SpeciesId.CLAMPERL,
        SpeciesId.WIMPOD,
        SpeciesId.CLOBBOPUS,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.MANTYKE,
        SpeciesId.TYMPOLE,
        SpeciesId.SKRELP,
        SpeciesId.ARROKUDA,
        SpeciesId.WIGLETT,
        SpeciesId.HISUI_QWILFISH,
        SpeciesId.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.BASCULEGION, SpeciesId.DONDOZO],
    }),
// Unova Grunts
  [TrainerType.GALACTIC_GRUNT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Galactic Grunt Female")
    .setHasDouble("Galactic Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.WURMPLE,
        SpeciesId.SHINX,
        SpeciesId.BURMY,
        SpeciesId.DRIFLOON,
        SpeciesId.GLAMEOW,
        SpeciesId.STUNKY,
        SpeciesId.BRONZOR,
        SpeciesId.CROAGUNK,
        SpeciesId.CARNIVINE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ZUBAT,
        SpeciesId.LICKITUNG,
        SpeciesId.RHYHORN,
        SpeciesId.TANGELA,
        SpeciesId.YANMA,
        SpeciesId.GLIGAR,
        SpeciesId.SWINUB,
        SpeciesId.SKORUPI,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.SNEASEL,
        SpeciesId.TEDDIURSA,
        SpeciesId.ELEKID,
        SpeciesId.MAGBY,
        SpeciesId.DUSKULL,
        SpeciesId.HISUI_GROWLITHE,
        SpeciesId.HISUI_QWILFISH,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SPIRITOMB, SpeciesId.ROTOM, SpeciesId.HISUI_SNEASEL],
    }),
// Sinnoh Grunts
    [TrainerType.PLASMA_GRUNT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Plasma Grunt Female")
    .setHasDouble("Plasma Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_plasma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.PATRAT,
        SpeciesId.LILLIPUP,
        SpeciesId.PURRLOIN,
        SpeciesId.WOOBAT,
        SpeciesId.TYMPOLE,
        SpeciesId.SANDILE,
        SpeciesId.SCRAGGY,
        SpeciesId.TRUBBISH,
        SpeciesId.VANILLITE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.TIMBURR,
        SpeciesId.VENIPEDE,
        SpeciesId.DARUMAKA,
        SpeciesId.FOONGUS,
        SpeciesId.FRILLISH,
        SpeciesId.JOLTIK,
        SpeciesId.KLINK,
        SpeciesId.CUBCHOO,
        SpeciesId.GOLETT,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.DRILBUR,
        SpeciesId.ZORUA,
        SpeciesId.MIENFOO,
        SpeciesId.PAWNIARD,
        SpeciesId.BOUFFALANT,
        SpeciesId.RUFFLET,
        SpeciesId.VULLABY,
        SpeciesId.DURANT,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.AXEW, SpeciesId.DRUDDIGON, SpeciesId.DEINO, SpeciesId.HISUI_ZORUA],
    }),
// Kalos Grunts
    [TrainerType.FLARE_GRUNT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Flare Grunt Female")
    .setHasDouble("Flare Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.HOUNDOUR,
        SpeciesId.GULPIN,
        SpeciesId.SKORUPI,
        SpeciesId.CROAGUNK,
        SpeciesId.PURRLOIN,
        SpeciesId.SCRAGGY,
        SpeciesId.FLETCHLING,
        SpeciesId.SCATTERBUG,
        SpeciesId.LITLEO,
        SpeciesId.ESPURR,
        SpeciesId.INKAY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POOCHYENA,
        SpeciesId.ELECTRIKE,
        SpeciesId.FOONGUS,
        SpeciesId.PANCHAM,
        SpeciesId.BINACLE,
        SpeciesId.SKRELP,
        SpeciesId.CLAUNCHER,
        SpeciesId.HELIOPTILE,
        SpeciesId.PHANTUMP,
        SpeciesId.PUMPKABOO,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.SNEASEL, SpeciesId.LITWICK, SpeciesId.PAWNIARD, SpeciesId.NOIBAT],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SLIGGOO, SpeciesId.HISUI_SLIGGOO, SpeciesId.HISUI_AVALUGG],
    }),
// Alola Grunts
    [TrainerType.AETHER_GRUNT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Aether Grunt Female")
    .setHasDouble("Aether Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aether_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.CORSOLA,
        SpeciesId.LILLIPUP,
        SpeciesId.PIKIPEK,
        SpeciesId.YUNGOOS,
        SpeciesId.ROCKRUFF,
        SpeciesId.MORELULL,
        SpeciesId.BOUNSWEET,
        SpeciesId.COMFEY,
        SpeciesId.KOMALA,
        SpeciesId.TOGEDEMARU,
        SpeciesId.ALOLA_RAICHU,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_EXEGGUTOR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POLIWAG,
        SpeciesId.CRABRAWLER,
        SpeciesId.ORICORIO,
        SpeciesId.CUTIEFLY,
        SpeciesId.WISHIWASHI,
        SpeciesId.MUDBRAY,
        SpeciesId.STUFFUL,
        SpeciesId.ORANGURU,
        SpeciesId.PASSIMIAN,
        SpeciesId.PYUKUMUKU,
        SpeciesId.BRUXISH,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_VULPIX,
        SpeciesId.ALOLA_MAROWAK,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.MINIOR,
        SpeciesId.TURTONATOR,
        SpeciesId.MIMIKYU,
        SpeciesId.DRAMPA,
        SpeciesId.GALAR_CORSOLA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.PORYGON, SpeciesId.JANGMO_O],
    }),
     [TrainerType.SKULL_GRUNT]: new TrainerConfig(nextTrainerId())
        .setHasGenders("Skull Grunt Female")
        .setHasDouble("Skull Grunts")
        .setMoneyMultiplier(1.0)
        .setEncounterBgm(TrainerType.PLASMA_GRUNT)
        .setBattleBgm("battle_plasma_grunt")
        .setMixedBattleBgm("battle_skull_grunt")
        .setVictoryBgm("victory_team_plasma")
        .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
        .setSpeciesPools({
          [TrainerPoolTier.COMMON]: [
            SpeciesId.EKANS,
            SpeciesId.VENONAT,
            SpeciesId.DROWZEE,
            SpeciesId.KOFFING,
            SpeciesId.SPINARAK,
            SpeciesId.SCRAGGY,
            SpeciesId.TRUBBISH,
            SpeciesId.MAREANIE,
            SpeciesId.SALANDIT,
            SpeciesId.ALOLA_RATTATA,
            SpeciesId.ALOLA_MEOWTH,
            SpeciesId.ALOLA_GRIMER,
          ],
          [TrainerPoolTier.UNCOMMON]: [
            SpeciesId.ZUBAT,
            SpeciesId.GASTLY,
            SpeciesId.HOUNDOUR,
            SpeciesId.SABLEYE,
            SpeciesId.VENIPEDE,
            SpeciesId.SANDILE,
            SpeciesId.VULLABY,
            SpeciesId.PANCHAM,
            SpeciesId.FOMANTIS,
            SpeciesId.ALOLA_MAROWAK,
          ],
          [TrainerPoolTier.RARE]: [
            SpeciesId.PAWNIARD,
            SpeciesId.WISHIWASHI,
            SpeciesId.SANDYGAST,
            SpeciesId.MIMIKYU,
            SpeciesId.DHELMISE,
            SpeciesId.NYMBLE,
          ],
          [TrainerPoolTier.SUPER_RARE]: [SpeciesId.GRUBBIN, SpeciesId.DEWPIDER],
        }),
// Galar Grunts
    [TrainerType.MACRO_GRUNT]: new TrainerConfig(nextTrainerId())
        .setHasGenders("Macro Grunt Female")
        .setHasDouble("Macro Grunts")
        .setMoneyMultiplier(1.0)
        .setEncounterBgm(TrainerType.PLASMA_GRUNT)
        .setBattleBgm("battle_plasma_grunt")
        .setMixedBattleBgm("battle_macro_grunt")
        .setVictoryBgm("victory_team_plasma")
        .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
        .setSpeciesPools({
          [TrainerPoolTier.COMMON]: [
            SpeciesId.STEELIX,
            SpeciesId.MAWILE,
            SpeciesId.FERROSEED,
            SpeciesId.KLINK,
            SpeciesId.SKWOVET,
            SpeciesId.ROOKIDEE,
            SpeciesId.ROLYCOLY,
            SpeciesId.CUFANT,
            SpeciesId.GALAR_MEOWTH,
            SpeciesId.GALAR_ZIGZAGOON,
          ],
          [TrainerPoolTier.UNCOMMON]: [
            SpeciesId.MAGNEMITE,
            SpeciesId.RIOLU,
            SpeciesId.DRILBUR,
            SpeciesId.APPLIN,
            SpeciesId.CRAMORANT,
            SpeciesId.ARROKUDA,
            SpeciesId.SINISTEA,
            SpeciesId.HATENNA,
            SpeciesId.FALINKS,
            SpeciesId.GALAR_PONYTA,
            SpeciesId.GALAR_YAMASK,
          ],
          [TrainerPoolTier.RARE]: [
            SpeciesId.SCIZOR,
            SpeciesId.BELDUM,
            SpeciesId.HONEDGE,
            SpeciesId.GALAR_FARFETCHD,
            SpeciesId.GALAR_MR_MIME,
            SpeciesId.GALAR_DARUMAKA,
          ],
          [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DURALUDON, SpeciesId.DREEPY],
        }),
// Paldea Grunts
    [TrainerType.STAR_GRUNT]: new TrainerConfig(nextTrainerId())
        .setHasGenders("Star Grunt Female")
        .setHasDouble("Star Grunts")
        .setMoneyMultiplier(1.0)
        .setEncounterBgm(TrainerType.PLASMA_GRUNT)
        .setBattleBgm("battle_plasma_grunt")
        .setMixedBattleBgm("battle_star_grunt")
        .setVictoryBgm("victory_team_plasma")
        .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
        .setSpeciesPools({
          [TrainerPoolTier.COMMON]: [
            SpeciesId.DUNSPARCE,
            SpeciesId.HOUNDOUR,
            SpeciesId.AZURILL,
            SpeciesId.GULPIN,
            SpeciesId.FOONGUS,
            SpeciesId.FLETCHLING,
            SpeciesId.LITLEO,
            SpeciesId.FLABEBE,
            SpeciesId.CRABRAWLER,
            SpeciesId.NYMBLE,
            SpeciesId.PAWMI,
            SpeciesId.FIDOUGH,
            SpeciesId.SQUAWKABILLY,
            SpeciesId.MASCHIFF,
            SpeciesId.SHROODLE,
            SpeciesId.KLAWF,
            SpeciesId.WIGLETT,
            SpeciesId.PALDEA_WOOPER,
          ],
          [TrainerPoolTier.UNCOMMON]: [
            SpeciesId.KOFFING,
            SpeciesId.EEVEE,
            SpeciesId.GIRAFARIG,
            SpeciesId.RALTS,
            SpeciesId.TORKOAL,
            SpeciesId.SEVIPER,
            SpeciesId.SCRAGGY,
            SpeciesId.ZORUA,
            SpeciesId.MIMIKYU,
            SpeciesId.IMPIDIMP,
            SpeciesId.FALINKS,
            SpeciesId.CAPSAKID,
            SpeciesId.TINKATINK,
            SpeciesId.BOMBIRDIER,
            SpeciesId.CYCLIZAR,
            SpeciesId.FLAMIGO,
            SpeciesId.PALDEA_TAUROS,
          ],
          [TrainerPoolTier.RARE]: [
            SpeciesId.MANKEY,
            SpeciesId.PAWNIARD,
            SpeciesId.CHARCADET,
            SpeciesId.FLITTLE,
            SpeciesId.VAROOM,
            SpeciesId.ORTHWORM,
          ],
          [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DONDOZO, SpeciesId.GIMMIGHOUL],
        }),
}