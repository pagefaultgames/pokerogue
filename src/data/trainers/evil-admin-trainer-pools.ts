import { SpeciesId } from "#enums/species-id";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import type { TrainerTierPools } from "#types/trainer-funcs";

/** Team Rocket's admin trainer pool. */
const ROCKET: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.RATTATA,
    SpeciesId.SPEAROW,
    SpeciesId.EKANS,
    SpeciesId.VILEPLUME,
    SpeciesId.DIGLETT,
    SpeciesId.GROWLITHE,
    SpeciesId.GRIMER,
    SpeciesId.DROWZEE,
    SpeciesId.VOLTORB,
    SpeciesId.EXEGGCUTE,
    SpeciesId.CUBONE,
    SpeciesId.KOFFING,
    SpeciesId.MAGIKARP,
    SpeciesId.ZUBAT,
    SpeciesId.ONIX,
    SpeciesId.HOUNDOUR,
    SpeciesId.MURKROW,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.ABRA,
    SpeciesId.GASTLY,
    SpeciesId.OMANYTE,
    SpeciesId.KABUTO,
    SpeciesId.PORYGON,
    SpeciesId.MANKEY,
    SpeciesId.SCYTHER,
    SpeciesId.ELEKID,
    SpeciesId.MAGBY,
    SpeciesId.ALOLA_SANDSHREW,
    SpeciesId.ALOLA_MEOWTH,
    SpeciesId.ALOLA_GEODUDE,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DRATINI, SpeciesId.LARVITAR],
};

/** Team Magma's admin trainer pool */
const MAGMA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GEODUDE,
    SpeciesId.KOFFING,
    SpeciesId.HOUNDOUR,
    SpeciesId.PHANPY,
    SpeciesId.POOCHYENA,
    SpeciesId.ZANGOOSE,
    SpeciesId.CACNEA,
    SpeciesId.SIZZLIPEDE,
    SpeciesId.ROLYCOLY,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.MAGBY,
    SpeciesId.LILEEP,
    SpeciesId.ANORITH,
    SpeciesId.DRAPION,
    SpeciesId.DRUDDIGON,
    SpeciesId.DARUMAKA,
    SpeciesId.SALANDIT,
    SpeciesId.TURTONATOR,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.RHYHORN, SpeciesId.ARON, SpeciesId.CHARCADET],
};

const AQUA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.KRABBY,
    SpeciesId.GRIMER,
    SpeciesId.MANTKYE,
    SpeciesId.POOCHYENA,
    SpeciesId.LOTAD,
    SpeciesId.WINGULL,
    SpeciesId.SEVIPER,
    SpeciesId.WAILMER,
    SpeciesId.SPHEAL,
    SpeciesId.RELICANTH,
    SpeciesId.ARROKUDA,
    SpeciesId.CLOBBOPUS,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.SHELLDER,
    SpeciesId.HORSEA,
    SpeciesId.OMANYTE,
    SpeciesId.KABUTO,
    SpeciesId.CROAGUNK,
    SpeciesId.BINACLE,
    SpeciesId.SKRELP,
    SpeciesId.WIMPOD,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.BASCULEGION],
};

const GALACTIC: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.ZUBAT,
    SpeciesId.MAGNEMITE,
    SpeciesId.RHYHORN,
    SpeciesId.TANGELA,
    SpeciesId.LICKITUNG,
    SpeciesId.MAGIKARP,
    SpeciesId.YANMA,
    SpeciesId.MURKROW,
    SpeciesId.SWINUB,
    SpeciesId.ELEKID,
    SpeciesId.MAGBY,
    SpeciesId.BRONZOR,
    SpeciesId.SKORUPI,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.ABRA,
    SpeciesId.GLIGAR,
    SpeciesId.SNEASEL,
    SpeciesId.DUSKULL,
    SpeciesId.DRIFLOON,
    SpeciesId.CRANIDOS,
    SpeciesId.SHIELDON,
    SpeciesId.ROTOM,
    SpeciesId.HISUI_QWILFISH,
  ],
  [TrainerPoolTier.RARE]: [
    SpeciesId.SPIRITOMB,
    SpeciesId.TEDDIURSA,
    SpeciesId.HISUI_SNEASEL,
    SpeciesId.HISUI_LILLIGANT,
  ],
};

const PLASMA_ZINZOLIN: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SWINUB,
    SpeciesId.GLALIE,
    SpeciesId.SNOVER,
    SpeciesId.MUNNA,
    SpeciesId.VENIPEDE,
    SpeciesId.FRILLISH,
    SpeciesId.CUBCHOO,
    SpeciesId.MIENFOO,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.BERGMITE,
    SpeciesId.EISCUE,
    SpeciesId.ALOLA_SANDSHREW,
    SpeciesId.GALAR_DARUMAKA,
    SpeciesId.HISUI_ZORUA,
    SpeciesId.HISUI_BRAVIARY,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.FRIGIBAX],
};

const PLASMA_COLRESS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.VOLTORB,
    SpeciesId.PORYGON,
    SpeciesId.NOSEPASS,
    SpeciesId.ROTOM,
    SpeciesId.DWEBBLE,
    SpeciesId.BLIPBUG,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.ELEKID,
    SpeciesId.MAGBY,
    SpeciesId.BELDUM,
    SpeciesId.GOLETT,
    SpeciesId.TIRTOUGA,
    SpeciesId.ARCHEN,
    SpeciesId.TYNAMO,
    SpeciesId.VAROOM,
    SpeciesId.ALOLA_GRIMER,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DURALUDON],
};

const FLARE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.ELECTRIKE,
    SpeciesId.SKORUPI,
    SpeciesId.PURRLOIN,
    SpeciesId.FOONGUS,
    SpeciesId.BUNNELBY,
    SpeciesId.FLETCHLING,
    SpeciesId.LITLEO,
    SpeciesId.PANGORO,
    SpeciesId.ESPURR,
    SpeciesId.INKAY,
    SpeciesId.CLAUNCHER,
    SpeciesId.HELIOPTILE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.HOUNDOUR,
    SpeciesId.SNEASEL,
    SpeciesId.LITWICK,
    SpeciesId.HONEDGE,
    SpeciesId.BINACLE,
    SpeciesId.SKRELP,
    SpeciesId.NOIBAT,
    SpeciesId.PHANTUMP,
    SpeciesId.PUMPKABOO,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.GOOMY, SpeciesId.HISUI_AVALUGG],
};

const AETHER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.ABRA,
    SpeciesId.MR_MIME,
    SpeciesId.NATU,
    [SpeciesId.STANTLER, SpeciesId.GIRAFARIG],
    SpeciesId.MEDITITE,
    SpeciesId.BALTOY,
    SpeciesId.ELGYEM,
    SpeciesId.INKAY,
    [SpeciesId.EXEGGUTOR, SpeciesId.ALOLA_EXEGGUTOR],
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.PORYGON,
    SpeciesId.SOLOSIS,
    SpeciesId.HATENNA,
    SpeciesId.ALOLA_GRIMER,
    [SpeciesId.SLOWKING, SpeciesId.GALAR_SLOWKING],
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.BELDUM],
};

const SKULL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GASTLY,
    SpeciesId.ZUBAT,
    SpeciesId.VENONAT,
    SpeciesId.STUNKY,
    SpeciesId.CROAGUNK,
    SpeciesId.VENIPEDE,
    SpeciesId.FOMANTIS,
    SpeciesId.TOXEL,
    SpeciesId.VULLABY,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.NIDORAN_F,
    SpeciesId.SKORUPI,
    SpeciesId.SKRELP,
    SpeciesId.GLIMMET,
    SpeciesId.GALAR_SLOWBRO,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.HISUI_SNEASEL],
};

const MACRO_COSMOS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.VULPIX,
    SpeciesId.MAWILE,
    SpeciesId.FROSLASS,
    SpeciesId.GOTHITA,
    SpeciesId.SPRITZEE,
    SpeciesId.SALANDIT,
    SpeciesId.INDEEDEE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.TOGEPI,
    [SpeciesId.GARDEVOIR, SpeciesId.HATENNA],
    SpeciesId.VULLABY,
    SpeciesId.FLABEBE,
    SpeciesId.MAREANIE,
    SpeciesId.GALAR_PONYTA,
    SpeciesId.GALAR_CORSOLA,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.APPLIN],
};

const STAR_DARK: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.MURKROW,
    SpeciesId.SEEDOT,
    SpeciesId.SABLEYE,
    SpeciesId.CACNEA,
    SpeciesId.STUNKY,
    SpeciesId.SANDILE,
    SpeciesId.INKAY,
    SpeciesId.NYMBLE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.UMBREON,
    SpeciesId.CORPHISH,
    SpeciesId.SNEASEL,
    SpeciesId.ZORUA,
    SpeciesId.IMPIDIMP,
    SpeciesId.BOMBIRDIER,
    SpeciesId.GALAR_ZIGZAGOON,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DEINO, SpeciesId.SPRIGATITO],
};

const STAR_FIRE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GROWLITHE,
    SpeciesId.HOUNDOUR,
    SpeciesId.NUMEL,
    SpeciesId.TORKOAL,
    SpeciesId.FLETCHLING,
    SpeciesId.LITLEO,
    SpeciesId.SIZZLIPEDE,
    SpeciesId.ROLYCOLY,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.PONYTA,
    SpeciesId.FLAREON,
    SpeciesId.MAGBY,
    SpeciesId.DARUMAKA,
    SpeciesId.LITWICK,
    SpeciesId.SALANDIT,
    SpeciesId.TURTONATOR,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.LARVESTA, SpeciesId.FUECOCO],
};

const STAR_POISON: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GRIMER,
    SpeciesId.VENONAT,
    SpeciesId.SEVIPER,
    SpeciesId.STUNKY,
    SpeciesId.FOONGUS,
    SpeciesId.MAREANIE,
    SpeciesId.TOXEL,
    SpeciesId.PALDEA_WOOPER,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.ZUBAT,
    SpeciesId.GASTLY,
    SpeciesId.SKRELP,
    SpeciesId.OVERQWIL,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.GLIMMET, SpeciesId.BULBASAUR],
};

const STAR_FAIRY: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.IGGLYBUFF,
    SpeciesId.AZURILL,
    SpeciesId.COTTONEE,
    SpeciesId.FLABEBE,
    SpeciesId.KLEFKI,
    SpeciesId.CUTIEFLY,
    SpeciesId.HATENNA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.CLEFFA,
    SpeciesId.TOGEPI,
    SpeciesId.GARDEVOIR,
    SpeciesId.SYLVEON,
    SpeciesId.MIMIKYU,
    SpeciesId.IMPIDIMP,
    SpeciesId.ALOLA_VULPIX,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.GALAR_PONYTA, SpeciesId.POPPLIO],
};

const STAR_FIGHTING: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.TYROGUE,
    SpeciesId.SHROOMISH,
    SpeciesId.MAKUHITA,
    SpeciesId.RIOLU,
    SpeciesId.CROAGUNK,
    SpeciesId.SCRAGGY,
    SpeciesId.MIENFOO,
    SpeciesId.PASSIMIAN,
    SpeciesId.PAWMI,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.MEDITITE,
    SpeciesId.GALLADE,
    SpeciesId.TIMBURR,
    SpeciesId.HAWLUCHA,
    SpeciesId.STUFFUL,
    SpeciesId.FALINKS,
    SpeciesId.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.JANGMO_O, SpeciesId.QUAXLY],
};

export type EvilTeam =
  | "rocket"
  | "magma"
  | "aqua"
  | "galactic"
  | "plasma_zinzolin"
  | "plasma_colress"
  | "flare"
  | "aether"
  | "skull"
  | "macro_cosmos"
  | "star_dark"
  | "star_fire"
  | "star_poison"
  | "star_fairy"
  | "star_fighting";

/** Trainer pools for each evil admin team */
export const evilAdminTrainerPools: Record<EvilTeam, TrainerTierPools> = {
  rocket: ROCKET,
  magma: MAGMA,
  aqua: AQUA,
  galactic: GALACTIC,
  plasma_zinzolin: PLASMA_ZINZOLIN,
  plasma_colress: PLASMA_COLRESS,
  flare: FLARE,
  aether: AETHER,
  macro_cosmos: MACRO_COSMOS,
  skull: SKULL,
  star_dark: STAR_DARK,
  star_fire: STAR_FIRE,
  star_poison: STAR_POISON,
  star_fairy: STAR_FAIRY,
  star_fighting: STAR_FIGHTING,
};
