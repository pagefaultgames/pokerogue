import { tmSpecies } from "#balance/tms";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { TrainerConfig, getRandomPartyMemberFunc, nextTrainerId, setTrainerId } from "#trainers/trainer-config";
import { getWavePartyTemplate, trainerPartyTemplates } from "#trainers/trainer-party-template";
import { TrainerConfigs } from "#types/trainer-funcs";


export const randomNPCTrainersConfig: TrainerConfigs = {
  [TrainerType.ACE_TRAINER]: new TrainerConfig(setTrainerId(TrainerType.ACE_TRAINER))
    .setHasGenders("Ace Trainer Female")
    .setHasDouble("Ace Duo")
    .setMoneyMultiplier(2.25)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.THREE_WEAK_BALANCED,
        trainerPartyTemplates.FOUR_WEAK_BALANCED,
        trainerPartyTemplates.FIVE_WEAK_BALANCED,
        trainerPartyTemplates.SIX_WEAK_BALANCED,
      ),
    ),
  [TrainerType.ARTIST]: new TrainerConfig(nextTrainerId())
    .setEncounterBgm(TrainerType.RICH)
    .setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.THREE_AVG)
    .setSpeciesPools([SpeciesId.SMEARGLE]),
  [TrainerType.BACKERS]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Backers")
    .setDoubleOnly()
    .setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.BACKPACKER]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Backpacker Female")
    .setHasDouble("Backpackers")
    .setSpeciesFilter(s => s.isOfType(PokemonType.FLYING) || s.isOfType(PokemonType.ROCK))
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.ONE_WEAK_ONE_STRONG,
      trainerPartyTemplates.ONE_AVG_ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.RHYHORN,
        SpeciesId.AIPOM,
        SpeciesId.MAKUHITA,
        SpeciesId.MAWILE,
        SpeciesId.NUMEL,
        SpeciesId.LILLIPUP,
        SpeciesId.SANDILE,
        SpeciesId.WOOLOO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.GIRAFARIG,
        SpeciesId.ZANGOOSE,
        SpeciesId.SEVIPER,
        SpeciesId.CUBCHOO,
        SpeciesId.PANCHAM,
        SpeciesId.SKIDDO,
        SpeciesId.MUDBRAY,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.TAUROS,
        SpeciesId.STANTLER,
        SpeciesId.DARUMAKA,
        SpeciesId.BOUFFALANT,
        SpeciesId.DEERLING,
        SpeciesId.IMPIDIMP,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.GALAR_DARUMAKA, SpeciesId.TEDDIURSA],
    }),
  [TrainerType.BAKER]: new TrainerConfig(nextTrainerId())
    .setEncounterBgm(TrainerType.CLERK)
    .setMoneyMultiplier(1.35)
    .setSpeciesFilter(
      s =>
        [s.ability1, s.ability2, s.abilityHidden].some(
          a =>
            !!a
            && [
              AbilityId.WHITE_SMOKE,
              AbilityId.GLUTTONY,
              AbilityId.HONEY_GATHER,
              AbilityId.HARVEST,
              AbilityId.CHEEK_POUCH,
              AbilityId.SWEET_VEIL,
              AbilityId.RIPEN,
              AbilityId.PURIFYING_SALT,
              AbilityId.WELL_BAKED_BODY,
              AbilityId.SUPERSWEET_SYRUP,
              AbilityId.HOSPITALITY,
            ].includes(a),
        )
        || s
          .getLevelMoves()
          .some(plm =>
            [MoveId.SOFT_BOILED, MoveId.SPORE, MoveId.MILK_DRINK, MoveId.OVERHEAT, MoveId.TEATIME].includes(plm[1]),
          ),
    ), // Mons with baking related abilities or who learn Overheat, Teatime, Milk Drink, Spore, or Soft-Boiled by level
  [TrainerType.BEAUTY]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.THREE_AVG_SAME,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.MEOWTH,
        SpeciesId.GOLDEEN,
        SpeciesId.MAREEP,
        SpeciesId.MARILL,
        SpeciesId.SKITTY,
        SpeciesId.GLAMEOW,
        SpeciesId.PURRLOIN,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.SMOOCHUM,
        SpeciesId.ROSELIA,
        SpeciesId.LUVDISC,
        SpeciesId.BLITZLE,
        SpeciesId.SEWADDLE,
        SpeciesId.PETILIL,
        SpeciesId.MINCCINO,
        SpeciesId.GOTHITA,
        SpeciesId.SPRITZEE,
        SpeciesId.FLITTLE,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.FEEBAS,
        SpeciesId.FURFROU,
        SpeciesId.SALANDIT,
        SpeciesId.BRUXISH,
        SpeciesId.HATENNA,
        SpeciesId.SNOM,
        SpeciesId.ALOLA_VULPIX,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.CLAMPERL,
        SpeciesId.AMAURA,
        SpeciesId.SYLVEON,
        SpeciesId.GOOMY,
        SpeciesId.POPPLIO,
      ],
    }),
  [TrainerType.BIKER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.EKANS,
        SpeciesId.KOFFING,
        SpeciesId.CROAGUNK,
        SpeciesId.VENIPEDE,
        SpeciesId.SCRAGGY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.GRIMER,
        SpeciesId.VOLTORB,
        SpeciesId.TEDDIURSA,
        SpeciesId.MAGBY,
        SpeciesId.SKORUPI,
        SpeciesId.SANDILE,
        SpeciesId.PAWNIARD,
        SpeciesId.SHROODLE,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.VAROOM, SpeciesId.CYCLIZAR],
    }),
  [TrainerType.BLACK_BELT]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Battle Girl", TrainerType.PSYCHIC)
    .setHasDouble("Crush Kin")
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpecialtyType(PokemonType.FIGHTING)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_STRONG,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.TWO_AVG_ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.NIDORAN_F,
        SpeciesId.NIDORAN_M,
        SpeciesId.MACHOP,
        SpeciesId.MAKUHITA,
        SpeciesId.MEDITITE,
        SpeciesId.CROAGUNK,
        SpeciesId.TIMBURR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MANKEY,
        SpeciesId.POLIWRATH,
        SpeciesId.TYROGUE,
        SpeciesId.BRELOOM,
        SpeciesId.SCRAGGY,
        SpeciesId.MIENFOO,
        SpeciesId.PANCHAM,
        SpeciesId.STUFFUL,
        SpeciesId.CRABRAWLER,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.HERACROSS,
        SpeciesId.RIOLU,
        SpeciesId.THROH,
        SpeciesId.SAWK,
        SpeciesId.PASSIMIAN,
        SpeciesId.CLOBBOPUS,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.HITMONTOP,
        SpeciesId.INFERNAPE,
        SpeciesId.GALLADE,
        SpeciesId.HAWLUCHA,
        SpeciesId.HAKAMO_O,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.KUBFU],
    }),
  [TrainerType.BREEDER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.325)
    .setEncounterBgm(TrainerType.POKEFAN)
    .setHasGenders("Breeder Female")
    .setHasDouble("Breeders")
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.FOUR_WEAK,
        trainerPartyTemplates.FIVE_WEAK,
        trainerPartyTemplates.SIX_WEAK,
      ),
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.PICHU,
        SpeciesId.CLEFFA,
        SpeciesId.IGGLYBUFF,
        SpeciesId.TOGEPI,
        SpeciesId.TYROGUE,
        SpeciesId.SMOOCHUM,
        SpeciesId.AZURILL,
        SpeciesId.BUDEW,
        SpeciesId.CHINGLING,
        SpeciesId.BONSLY,
        SpeciesId.MIME_JR,
        SpeciesId.HAPPINY,
        SpeciesId.MANTYKE,
        SpeciesId.TOXEL,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.DITTO,
        SpeciesId.ELEKID,
        SpeciesId.MAGBY,
        SpeciesId.WYNAUT,
        SpeciesId.MUNCHLAX,
        SpeciesId.RIOLU,
        SpeciesId.AUDINO,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ALOLA_RATTATA,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_VULPIX,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_MEOWTH,
        SpeciesId.GALAR_PONYTA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_GRIMER,
        SpeciesId.GALAR_MEOWTH,
        SpeciesId.GALAR_SLOWPOKE,
        SpeciesId.GALAR_FARFETCHD,
        SpeciesId.HISUI_GROWLITHE,
        SpeciesId.HISUI_VOLTORB,
        SpeciesId.HISUI_QWILFISH,
        SpeciesId.HISUI_SNEASEL,
        SpeciesId.HISUI_ZORUA,
      ],
    }),
  [TrainerType.CLERK]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Clerk Female")
    .setHasDouble("Colleagues")
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.MEOWTH,
        SpeciesId.PSYDUCK,
        SpeciesId.BUDEW,
        SpeciesId.PIDOVE,
        SpeciesId.CINCCINO,
        SpeciesId.LITLEO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.JIGGLYPUFF,
        SpeciesId.MAGNEMITE,
        SpeciesId.MARILL,
        SpeciesId.COTTONEE,
        SpeciesId.SKIDDO,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.BUIZEL, SpeciesId.SNEASEL, SpeciesId.KLEFKI, SpeciesId.INDEEDEE],
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.3)
    .setHasGenders("Cyclist Female")
    .setHasDouble("Cyclists")
    .setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.DODUO,
        SpeciesId.PICHU,
        SpeciesId.TAILLOW,
        SpeciesId.STARLY,
        SpeciesId.PONYTA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ELECTRIKE,
        SpeciesId.SHINX,
        SpeciesId.BLITZLE,
        SpeciesId.DUCKLETT,
        SpeciesId.WATTREL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.YANMA,
        SpeciesId.NINJASK,
        SpeciesId.VENIPEDE,
        SpeciesId.EMOLGA,
        SpeciesId.SKIDDO,
        SpeciesId.ROLYCOLY,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SHELMET, SpeciesId.DREEPY],
    }),
  [TrainerType.DANCER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [SpeciesId.RALTS, SpeciesId.SPOINK, SpeciesId.LOTAD, SpeciesId.BUDEW],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.SPINDA, SpeciesId.SWABLU, SpeciesId.MARACTUS],
      [TrainerPoolTier.RARE]: [SpeciesId.BELLOSSOM, SpeciesId.HITMONTOP, SpeciesId.MIME_JR, SpeciesId.ORICORIO],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.QUAXLY, SpeciesId.JANGMO_O],
    }),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.45)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.FOUR_WEAK,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.GROUND)),
  [TrainerType.DOCTOR]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Nurse", "lass")
    .setHasDouble("Medical Team")
    .setMoneyMultiplier(3)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.HEAL_PULSE)),
  [TrainerType.FIREBREATHER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.SMOG) || s.isOfType(PokemonType.FIRE)),
  [TrainerType.FISHERMAN]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.25)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setSpecialtyType(PokemonType.WATER)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.THREE_WEAK_SAME,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.TENTACOOL,
        SpeciesId.MAGIKARP,
        SpeciesId.GOLDEEN,
        SpeciesId.STARYU,
        SpeciesId.REMORAID,
        SpeciesId.SKRELP,
        SpeciesId.CLAUNCHER,
        SpeciesId.ARROKUDA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POLIWAG,
        SpeciesId.SHELLDER,
        SpeciesId.KRABBY,
        SpeciesId.HORSEA,
        SpeciesId.CARVANHA,
        SpeciesId.BARBOACH,
        SpeciesId.CORPHISH,
        SpeciesId.FINNEON,
        SpeciesId.TYMPOLE,
        SpeciesId.BASCULIN,
        SpeciesId.FRILLISH,
        SpeciesId.INKAY,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.CHINCHOU,
        SpeciesId.CORSOLA,
        SpeciesId.WAILMER,
        SpeciesId.CLAMPERL,
        SpeciesId.LUVDISC,
        SpeciesId.MANTYKE,
        SpeciesId.ALOMOMOLA,
        SpeciesId.TATSUGIRI,
        SpeciesId.VELUZA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.LAPRAS, SpeciesId.FEEBAS, SpeciesId.RELICANTH, SpeciesId.DONDOZO],
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.2)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpecialtyType(PokemonType.ELECTRIC)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(nextTrainerId())
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setSpeciesFilter(s => tmSpecies[MoveId.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(nextTrainerId())
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.SANDSHREW,
        SpeciesId.DIGLETT,
        SpeciesId.GEODUDE,
        SpeciesId.MACHOP,
        SpeciesId.ARON,
        SpeciesId.ROGGENROLA,
        SpeciesId.DRILBUR,
        SpeciesId.NACLI,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ZUBAT,
        SpeciesId.RHYHORN,
        SpeciesId.ONIX,
        SpeciesId.CUBONE,
        SpeciesId.WOOBAT,
        SpeciesId.SWINUB,
        SpeciesId.NOSEPASS,
        SpeciesId.HIPPOPOTAS,
        SpeciesId.DWEBBLE,
        SpeciesId.KLAWF,
        SpeciesId.TOEDSCOOL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.TORKOAL,
        SpeciesId.TRAPINCH,
        SpeciesId.BARBOACH,
        SpeciesId.GOLETT,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.GALAR_STUNFISK,
        SpeciesId.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.MAGBY, SpeciesId.LARVITAR],
    }),
  [TrainerType.HOOLIGANS]: new TrainerConfig(nextTrainerId())
    .setDoubleOnly()
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.TWO_WEAK,
        trainerPartyTemplates.TWO_AVG,
        trainerPartyTemplates.ONE_AVG_ONE_STRONG,
      ),
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.POISON) || s.isOfType(PokemonType.DARK)),
  [TrainerType.HOOPSTER]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.INFIELDER]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.JANITOR]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.1).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.LINEBACKER]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.MAID]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.6).setEncounterBgm(TrainerType.RICH),
  [TrainerType.MUSICIAN]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.1)
    .setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
    )
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.SING)),
  [TrainerType.HEX_MANIAC]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.ONE_AVG_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.TWO_STRONG,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.GHOST) || s.isOfType(PokemonType.PSYCHIC)),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.3).setEncounterBgm("lass"),
  [TrainerType.OFFICER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.VULPIX,
        SpeciesId.GROWLITHE,
        SpeciesId.SNUBBULL,
        SpeciesId.POOCHYENA,
        SpeciesId.ELECTRIKE,
        SpeciesId.LILLIPUP,
        SpeciesId.YAMPER,
        SpeciesId.FIDOUGH,
      ],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.HOUNDOUR, SpeciesId.ROCKRUFF, SpeciesId.MASCHIFF],
      [TrainerPoolTier.RARE]: [SpeciesId.JOLTEON, SpeciesId.RIOLU],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SLAKOTH],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.ENTEI, SpeciesId.SUICUNE, SpeciesId.RAIKOU],
    }),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesFilter(
      s =>
        [s.ability1, s.ability2, s.abilityHidden].some(
          a =>
            !!a
            && [
              AbilityId.DRIZZLE,
              AbilityId.SWIFT_SWIM,
              AbilityId.HYDRATION,
              AbilityId.RAIN_DISH,
              AbilityId.DRY_SKIN,
              AbilityId.WIND_POWER,
            ].includes(a),
        ) || s.getLevelMoves().some(plm => plm[1] === MoveId.RAIN_DANCE),
    ), // Mons with rain abilities or who learn Rain Dance by level
  [TrainerType.PILOT]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.75)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.THREE_AVG,
    )
    .setSpeciesFilter(s => tmSpecies[MoveId.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setName("Pokéfan")
    .setHasGenders("Pokéfan Female")
    .setHasDouble("Pokéfan Family")
    .setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.FIVE_WEAK,
    )
    .setSpeciesFilter(s => tmSpecies[MoveId.HELPING_HAND].indexOf(s.speciesId) > -1),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(0.2)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("Preschooler Female", "lass")
    .setHasDouble("Preschoolers")
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.CATERPIE,
        SpeciesId.PICHU,
        SpeciesId.SANDSHREW,
        SpeciesId.LEDYBA,
        SpeciesId.BUDEW,
        SpeciesId.BURMY,
        SpeciesId.WOOLOO,
        SpeciesId.PAWMI,
        SpeciesId.SMOLIV,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.EEVEE,
        SpeciesId.CLEFFA,
        SpeciesId.IGGLYBUFF,
        SpeciesId.SWINUB,
        SpeciesId.WOOPER,
        SpeciesId.DRIFLOON,
        SpeciesId.DEDENNE,
        SpeciesId.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.RALTS, SpeciesId.RIOLU, SpeciesId.JOLTIK, SpeciesId.TANDEMAUS],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DARUMAKA, SpeciesId.TINKATINK],
    }),
  [TrainerType.PSYCHIC]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Psychic Female")
    .setHasDouble("Psychics")
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME,
      trainerPartyTemplates.ONE_STRONGER,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.ABRA,
        SpeciesId.DROWZEE,
        SpeciesId.RALTS,
        SpeciesId.SPOINK,
        SpeciesId.GOTHITA,
        SpeciesId.SOLOSIS,
        SpeciesId.BLIPBUG,
        SpeciesId.ESPURR,
        SpeciesId.HATENNA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MIME_JR,
        SpeciesId.EXEGGCUTE,
        SpeciesId.MEDITITE,
        SpeciesId.NATU,
        SpeciesId.EXEGGCUTE,
        SpeciesId.WOOBAT,
        SpeciesId.INKAY,
        SpeciesId.ORANGURU,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ELGYEM,
        SpeciesId.SIGILYPH,
        SpeciesId.BALTOY,
        SpeciesId.GIRAFARIG,
        SpeciesId.MEOWSTIC,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.BELDUM, SpeciesId.ESPEON, SpeciesId.STANTLER],
    }),
  [TrainerType.RANGER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setName("Pokémon Ranger")
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setHasGenders("Pokémon Ranger Female")
    .setHasDouble("Pokémon Rangers")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.PICHU,
        SpeciesId.GROWLITHE,
        SpeciesId.PONYTA,
        SpeciesId.ZIGZAGOON,
        SpeciesId.SEEDOT,
        SpeciesId.BIDOOF,
        SpeciesId.RIOLU,
        SpeciesId.SEWADDLE,
        SpeciesId.SKIDDO,
        SpeciesId.SALANDIT,
        SpeciesId.YAMPER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.AZURILL,
        SpeciesId.TAUROS,
        SpeciesId.MAREEP,
        SpeciesId.FARFETCHD,
        SpeciesId.TEDDIURSA,
        SpeciesId.SHROOMISH,
        SpeciesId.ELECTRIKE,
        SpeciesId.BUDEW,
        SpeciesId.BUIZEL,
        SpeciesId.MUDBRAY,
        SpeciesId.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.EEVEE,
        SpeciesId.SCYTHER,
        SpeciesId.KANGASKHAN,
        SpeciesId.RALTS,
        SpeciesId.MUNCHLAX,
        SpeciesId.ZORUA,
        SpeciesId.PALDEA_TAUROS,
        SpeciesId.TINKATINK,
        SpeciesId.CYCLIZAR,
        SpeciesId.FLAMIGO,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.LARVESTA],
    }),
  [TrainerType.RICH]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(3.25)
    .setName("Gentleman")
    .setHasGenders("Madame")
    .setHasDouble("Rich Couple")
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.THREE_AVG,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.NORMAL) || s.isOfType(PokemonType.ELECTRIC)),
  [TrainerType.RICH_KID]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(2.5)
    .setName("Rich Boy")
    .setHasGenders("Lady")
    .setHasDouble("Rich Kids")
    .setEncounterBgm(TrainerType.RICH)
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK_SAME, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
    .setSpeciesFilter(s => s.baseTotal <= 460),
  [TrainerType.ROUGHNECK]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => s.isOfType(PokemonType.DARK)),
  [TrainerType.SAILOR]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.WATER) || s.isOfType(PokemonType.FIGHTING)),
  [TrainerType.SCIENTIST]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Scientist Female")
    .setHasDouble("Scientists")
    .setMoneyMultiplier(1.7)
    .setEncounterBgm(TrainerType.SCIENTIST)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.MAGNEMITE,
        SpeciesId.GRIMER,
        SpeciesId.DROWZEE,
        SpeciesId.VOLTORB,
        SpeciesId.KOFFING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.BALTOY,
        SpeciesId.BRONZOR,
        SpeciesId.FERROSEED,
        SpeciesId.KLINK,
        SpeciesId.CHARJABUG,
        SpeciesId.BLIPBUG,
        SpeciesId.HELIOPTILE,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ABRA,
        SpeciesId.DITTO,
        SpeciesId.PORYGON,
        SpeciesId.ELEKID,
        SpeciesId.SOLOSIS,
        SpeciesId.GALAR_WEEZING,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.OMANYTE,
        SpeciesId.KABUTO,
        SpeciesId.AERODACTYL,
        SpeciesId.LILEEP,
        SpeciesId.ANORITH,
        SpeciesId.CRANIDOS,
        SpeciesId.SHIELDON,
        SpeciesId.TIRTOUGA,
        SpeciesId.ARCHEN,
        SpeciesId.ARCTOVISH,
        SpeciesId.ARCTOZOLT,
        SpeciesId.DRACOVISH,
        SpeciesId.DRACOZOLT,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.ROTOM, SpeciesId.MELTAN],
    }),
  [TrainerType.SMASHER]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(nextTrainerId())
    .setName("Worker")
    .setHasDouble("Workers")
    .setMoneyMultiplier(1.7)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ICE) || s.isOfType(PokemonType.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(nextTrainerId()).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SCHOOL_KID]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(0.75)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("School Kid Female", "lass")
    .setHasDouble("School Kids")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.ODDISH,
        SpeciesId.EXEGGCUTE,
        SpeciesId.TEDDIURSA,
        SpeciesId.WURMPLE,
        SpeciesId.RALTS,
        SpeciesId.SHROOMISH,
        SpeciesId.FLETCHLING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.VOLTORB,
        SpeciesId.WHISMUR,
        SpeciesId.MEDITITE,
        SpeciesId.MIME_JR,
        SpeciesId.NYMBLE,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.TANGELA, SpeciesId.EEVEE, SpeciesId.YANMA],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.TADBULB],
    }),
  [TrainerType.SWIMMER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.3)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setHasGenders("Swimmer Female")
    .setHasDouble("Swimmers")
    .setSpecialtyType(PokemonType.WATER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(nextTrainerId())
    .setDoubleOnly()
    .setMoneyMultiplier(0.65)
    .setUseSameSeedForAllMembers()
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.TWO_WEAK,
        trainerPartyTemplates.TWO_AVG,
        trainerPartyTemplates.TWO_STRONG,
      ),
    )
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([
        SpeciesId.METAPOD,
        SpeciesId.LEDYBA,
        SpeciesId.CLEFFA,
        SpeciesId.MAREEP,
        SpeciesId.WOOPER,
        SpeciesId.TEDDIURSA,
        SpeciesId.REMORAID,
        SpeciesId.HOUNDOUR,
        SpeciesId.SILCOON,
        SpeciesId.PLUSLE,
        SpeciesId.VOLBEAT,
        SpeciesId.SPINDA,
        SpeciesId.BONSLY,
        SpeciesId.PETILIL,
        SpeciesId.SPRITZEE,
        SpeciesId.BOUNSWEET,
        SpeciesId.MILCERY,
        SpeciesId.PICHU,
      ]),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.KAKUNA,
          SpeciesId.SPINARAK,
          SpeciesId.IGGLYBUFF,
          SpeciesId.MAREEP,
          SpeciesId.PALDEA_WOOPER,
          SpeciesId.PHANPY,
          SpeciesId.MANTYKE,
          SpeciesId.ELECTRIKE,
          SpeciesId.CASCOON,
          SpeciesId.MINUN,
          SpeciesId.ILLUMISE,
          SpeciesId.SPINDA,
          SpeciesId.MIME_JR,
          SpeciesId.COTTONEE,
          SpeciesId.SWIRLIX,
          SpeciesId.FOMANTIS,
          SpeciesId.FIDOUGH,
          SpeciesId.EEVEE,
        ],
        TrainerSlot.TRAINER_PARTNER,
      ),
    )
    .setEncounterBgm(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Veteran Female")
    .setHasDouble("Veteran Duo")
    .setMoneyMultiplier(2.5)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.DRAGON)),
  [TrainerType.WAITER]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Waitress")
    .setHasDouble("Restaurant Staff")
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.CLEFFA,
        SpeciesId.CHATOT,
        SpeciesId.PANSAGE,
        SpeciesId.PANSEAR,
        SpeciesId.PANPOUR,
        SpeciesId.MINCCINO,
      ],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.TROPIUS, SpeciesId.PETILIL, SpeciesId.BOUNSWEET, SpeciesId.INDEEDEE],
      [TrainerPoolTier.RARE]: [SpeciesId.APPLIN, SpeciesId.SINISTEA, SpeciesId.POLTCHAGEIST],
    }),
  [TrainerType.WORKER]: new TrainerConfig(nextTrainerId())
    .setHasGenders("Worker Female")
    .setHasDouble("Workers")
    .setEncounterBgm(TrainerType.CLERK)
    .setMoneyMultiplier(1.7)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ROCK) || s.isOfType(PokemonType.STEEL)),
  [TrainerType.YOUNGSTER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(0.5)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("Lass", "lass")
    .setHasDouble("Beginners")
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAKER)
    .setSpeciesPools([
      SpeciesId.CATERPIE,
      SpeciesId.WEEDLE,
      SpeciesId.RATTATA,
      SpeciesId.SENTRET,
      SpeciesId.POOCHYENA,
      SpeciesId.ZIGZAGOON,
      SpeciesId.WURMPLE,
      SpeciesId.BIDOOF,
      SpeciesId.PATRAT,
      SpeciesId.LILLIPUP,
    ]),
}