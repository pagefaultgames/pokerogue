import type { TrainerTierPools } from "#app/data/trainers/typedefs";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { Species } from "#enums/species";

/** Team Rocket's admin trainer pool. */
const ROCKET: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.RATTATA,
    Species.SPEAROW,
    Species.EKANS,
    Species.VILEPLUME,
    Species.DIGLETT,
    Species.GROWLITHE,
    Species.GRIMER,
    Species.DROWZEE,
    Species.VOLTORB,
    Species.EXEGGCUTE,
    Species.CUBONE,
    Species.KOFFING,
    Species.MAGIKARP,
    Species.ZUBAT,
    Species.ONIX,
    Species.HOUNDOUR,
    Species.MURKROW,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.ABRA,
    Species.GASTLY,
    Species.OMANYTE,
    Species.KABUTO,
    Species.PORYGON,
    Species.MANKEY,
    Species.SCYTHER,
    Species.ELEKID,
    Species.MAGBY,
    Species.ALOLA_SANDSHREW,
    Species.ALOLA_MEOWTH,
    Species.ALOLA_GEODUDE,
    Species.ALOLA_GRIMER,
    Species.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [Species.DRATINI, Species.LARVITAR],
};

/** Team Magma's admin trainer pool */
const MAGMA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.DIGLETT,
    Species.GROWLITHE,
    Species.VULPIX,
    Species.KOFFING,
    Species.RHYHORN,
    Species.SLUGMA,
    Species.HOUNDOUR,
    Species.POOCHYENA,
    Species.TORKOAL,
    Species.ZANGOOSE,
    Species.SOLROCK,
    Species.BALTOY,
    Species.ROLYCOLY,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.MAGBY,
    Species.TRAPINCH,
    Species.LILEEP,
    Species.ANORITH,
    Species.GOLETT,
    Species.FLETCHLING,
    Species.SALANDIT,
    Species.TURTONATOR,
    Species.TOEDSCOOL,
    Species.CAPSAKID,
    Species.HISUI_GROWLITHE,
  ],
  [TrainerPoolTier.RARE]: [Species.CHARCADET, Species.ARON],
};

const AQUA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.TENTACOOL,
    Species.GRIMER,
    Species.AZURILL,
    Species.CHINCHOU,
    Species.REMORAID,
    Species.POOCHYENA,
    Species.LOTAD,
    Species.WINGULL,
    Species.WAILMER,
    Species.SEVIPER,
    Species.BARBOACH,
    Species.CORPHISH,
    Species.SPHEAL,
    Species.CLAMPERL,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.MANTYKE,
    Species.HORSEA,
    Species.FEEBAS,
    Species.TYMPOLE,
    Species.SKRELP,
    Species.WIMPOD,
    Species.DHELMISE,
    Species.ARROKUDA,
    Species.CLOBBOPUS,
    Species.HISUI_QWILFISH,
    Species.WIGLETT,
  ],
  [TrainerPoolTier.RARE]: [Species.BASCULEGION, Species.DONDOZO],
};

const GALACTIC: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ZUBAT,
    Species.MAGNEMITE,
    Species.RHYHORN,
    Species.TANGELA,
    Species.LICKITUNG,
    Species.MAGIKARP,
    Species.YANMA,
    Species.MURKROW,
    Species.SWINUB,
    Species.ELEKID,
    Species.MAGBY,
    Species.BRONZOR,
    Species.SKORUPI,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.ABRA,
    Species.GLIGAR,
    Species.SNEASEL,
    Species.DUSKULL,
    Species.DRIFLOON,
    Species.CRANIDOS,
    Species.SHIELDON,
    Species.ROTOM,
    Species.HISUI_QWILFISH,
  ],
  [TrainerPoolTier.RARE]: [Species.SPIRITOMB, Species.TEDDIURSA, Species.HISUI_SNEASEL, Species.HISUI_LILLIGANT],
};

const PLASMA_ZINZOLIN: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.SNEASEL,
    Species.SWINUB,
    Species.SNORUNT,
    Species.SNOVER,
    Species.TIMBURR,
    Species.TYMPOLE,
    Species.SANDILE,
    Species.DARUMAKA,
    Species.VANILLITE,
    Species.FOONGUS,
    Species.FRILLISH,
    Species.JOLTIK,
    Species.FERROSEED,
    Species.CUBCHOO,
    Species.GALAR_DARUMAKA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.SPHEAL,
    Species.DRILBUR,
    Species.SIGILYPH,
    Species.YAMASK,
    Species.ZORUA,
    Species.TYNAMO,
    Species.MIENFOO,
    Species.GOLETT,
    Species.PAWNIARD,
    Species.VULLABY,
    Species.DURANT,
    Species.BERGMITE,
    Species.EISCUE,
    Species.ALOLA_SANDSHREW,
    Species.HISUI_ZORUA,
  ],
  [TrainerPoolTier.RARE]: [Species.DEINO, Species.FRIGIBAX, Species.HISUI_BRAVIARY],
};

const PLASMA_COLRESS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.MAGNEMITE,
    Species.GRIMER,
    Species.VOLTORB,
    Species.PORYGON,
    Species.BRONZOR,
    Species.ROTOM,
    Species.MUNNA,
    Species.DWEBBLE,
    Species.FERROSEED,
    Species.ELGYEM,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.BELDUM,
    Species.SIGILYPH,
    Species.TIRTOUGA,
    Species.ARCHEN,
    Species.TYNAMO,
    Species.GOLETT,
    Species.BLIPBUG,
    Species.VAROOM,
    Species.ALOLA_GRIMER,
    Species.HISUI_VOLTORB,
  ],
  [TrainerPoolTier.RARE]: [Species.ELEKID, Species.MAGBY, Species.PAWNIARD, Species.DURALUDON],
};

const FLARE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ELECTRIKE,
    Species.SKORUPI,
    Species.PURRLOIN,
    Species.FOONGUS,
    Species.BUNNELBY,
    Species.FLETCHLING,
    Species.LITLEO,
    Species.PANGORO,
    Species.ESPURR,
    Species.INKAY,
    Species.CLAUNCHER,
    Species.HELIOPTILE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.HOUNDOUR,
    Species.SNEASEL,
    Species.LITWICK,
    Species.HONEDGE,
    Species.BINACLE,
    Species.SKRELP,
    Species.NOIBAT,
    Species.PHANTUMP,
    Species.PUMPKABOO,
  ],
  [TrainerPoolTier.RARE]: [Species.GOOMY, Species.HISUI_AVALUGG],
};

const AETHER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ABRA,
    Species.SLOWPOKE,
    Species.MAGNEMITE,
    Species.EXEGGUTOR,
    Species.NATU,
    Species.BALTOY,
    Species.MIME_JR,
    Species.ELGYEM,
    Species.INKAY,
    Species.BRUXISH,
    Species.BLIPBUG,
    Species.ALOLA_RAICHU,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.RALTS,
    Species.MEDITITE,
    Species.BELDUM,
    Species.SOLOSIS,
    Species.HATENNA,
    Species.STANTLER,
    Species.GIRAFARIG,
    Species.ALOLA_GRIMER,
    Species.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [Species.PORYGON, Species.ARMAROUGE],
};

const SKULL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.GASTLY,
    Species.KOFFING,
    Species.ZUBAT,
    Species.VENONAT,
    Species.STUNKY,
    Species.CROAGUNK,
    Species.VENIPEDE,
    Species.SCRAGGY,
    Species.MAREANIE,
    Species.FOMANTIS,
    Species.ALOLA_GRIMER,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.NIDORAN_F,
    Species.SKORUPI,
    Species.PAWNIARD,
    Species.VULLABY,
    Species.TOXEL,
    Species.GLIMMET,
    Species.PALDEA_WOOPER,
    Species.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [Species.SKRELP, Species.HISUI_SNEASEL],
};

const MACRO_COSMOS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.VULPIX,
    Species.FEEBAS,
    Species.MAWILE,
    Species.FROSLASS,
    Species.GOTHITA,
    Species.FLABEBE,
    Species.SALANDIT,
    Species.TSAREENA,
    Species.SINISTEA,
    Species.HATENNA,
    Species.INDEEDEE,
    Species.GALAR_PONYTA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.TOGEPI,
    Species.VULLABY,
    Species.MAREANIE,
    Species.CUFANT,
    Species.TINKATINK,
    Species.ALOLA_VULPIX,
    Species.GALAR_CORSOLA,
  ],
  [TrainerPoolTier.RARE]: [Species.APPLIN, Species.HISUI_LILLIGANT],
};

const STAR_DARK: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.MURKROW,
    Species.SEEDOT,
    Species.SABLEYE,
    Species.CACNEA,
    Species.STUNKY,
    Species.SANDILE,
    Species.INKAY,
    Species.NYMBLE,
    Species.MASCHIFF,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.UMBREON,
    Species.CORPHISH,
    Species.SNEASEL,
    Species.ZORUA,
    Species.IMPIDIMP,
    Species.BOMBIRDIER,
    Species.GALAR_ZIGZAGOON,
  ],
  [TrainerPoolTier.RARE]: [Species.DEINO, Species.SPRIGATITO],
};

const STAR_FIRE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.GROWLITHE,
    Species.HOUNDOUR,
    Species.NUMEL,
    Species.TORKOAL,
    Species.FLETCHLING,
    Species.LITLEO,
    Species.SIZZLIPEDE,
    Species.ROLYCOLY,
    Species.CAPSAKID,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.PONYTA,
    Species.FLAREON,
    Species.MAGBY,
    Species.DARUMAKA,
    Species.LITWICK,
    Species.SALANDIT,
    Species.TURTONATOR,
  ],
  [TrainerPoolTier.RARE]: [Species.LARVESTA, Species.FUECOCO],
};

const STAR_POISON: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.GRIMER,
    Species.VENONAT,
    Species.SEVIPER,
    Species.STUNKY,
    Species.FOONGUS,
    Species.MAREANIE,
    Species.TOXEL,
    Species.GRAFAIAI,
    Species.PALDEA_WOOPER,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.ZUBAT,
    Species.GASTLY,
    Species.SKRELP,
    Species.OVERQWIL,
    Species.ALOLA_GRIMER,
    Species.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [Species.GLIMMET, Species.BULBASAUR],
};

const STAR_FAIRY: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.IGGLYBUFF,
    Species.AZURILL,
    Species.COTTONEE,
    Species.FLABEBE,
    Species.KLEFKI,
    Species.CUTIEFLY,
    Species.HATENNA,
    Species.TINKATINK,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.CLEFFA,
    Species.TOGEPI,
    Species.GARDEVOIR,
    Species.SYLVEON,
    Species.MIMIKYU,
    Species.IMPIDIMP,
    Species.ALOLA_VULPIX,
  ],
  [TrainerPoolTier.RARE]: [Species.GALAR_PONYTA, Species.POPPLIO],
};

const STAR_FIGHTING: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.TYROGUE,
    Species.SHROOMISH,
    Species.MAKUHITA,
    Species.RIOLU,
    Species.CROAGUNK,
    Species.SCRAGGY,
    Species.MIENFOO,
    Species.PASSIMIAN,
    Species.PAWMI,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.MEDITITE,
    Species.GALLADE,
    Species.TIMBURR,
    Species.HAWLUCHA,
    Species.STUFFUL,
    Species.FALINKS,
    Species.FLAMIGO,
    Species.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [Species.JANGMO_O, Species.QUAXLY],
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
