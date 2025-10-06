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
    SpeciesId.DIGLETT,
    SpeciesId.GROWLITHE,
    SpeciesId.VULPIX,
    SpeciesId.KOFFING,
    SpeciesId.RHYHORN,
    SpeciesId.SLUGMA,
    SpeciesId.HOUNDOUR,
    SpeciesId.POOCHYENA,
    SpeciesId.TORKOAL,
    SpeciesId.ZANGOOSE,
    SpeciesId.SOLROCK,
    SpeciesId.BALTOY,
    SpeciesId.ROLYCOLY,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.MAGBY,
    SpeciesId.TRAPINCH,
    SpeciesId.LILEEP,
    SpeciesId.ANORITH,
    SpeciesId.GOLETT,
    SpeciesId.FLETCHLING,
    SpeciesId.SALANDIT,
    SpeciesId.TURTONATOR,
    SpeciesId.TOEDSCOOL,
    SpeciesId.CAPSAKID,
    SpeciesId.HISUI_GROWLITHE,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.CHARCADET, SpeciesId.ARON],
};

const AQUA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.TENTACOOL,
    SpeciesId.GRIMER,
    SpeciesId.AZURILL,
    SpeciesId.CHINCHOU,
    SpeciesId.REMORAID,
    SpeciesId.POOCHYENA,
    SpeciesId.LOTAD,
    SpeciesId.WINGULL,
    SpeciesId.WAILMER,
    SpeciesId.SEVIPER,
    SpeciesId.BARBOACH,
    SpeciesId.CORPHISH,
    SpeciesId.SPHEAL,
    SpeciesId.CLAMPERL,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.MANTYKE,
    SpeciesId.HORSEA,
    SpeciesId.FEEBAS,
    SpeciesId.TYMPOLE,
    SpeciesId.SKRELP,
    SpeciesId.WIMPOD,
    SpeciesId.DHELMISE,
    SpeciesId.ARROKUDA,
    SpeciesId.CLOBBOPUS,
    SpeciesId.HISUI_QWILFISH,
    SpeciesId.WIGLETT,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.BASCULEGION, SpeciesId.DONDOZO],
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
    SpeciesId.SNEASEL,
    SpeciesId.SWINUB,
    SpeciesId.SNORUNT,
    SpeciesId.SNOVER,
    SpeciesId.TIMBURR,
    SpeciesId.TYMPOLE,
    SpeciesId.SANDILE,
    SpeciesId.DARUMAKA,
    SpeciesId.VANILLITE,
    SpeciesId.FOONGUS,
    SpeciesId.FRILLISH,
    SpeciesId.JOLTIK,
    SpeciesId.FERROSEED,
    SpeciesId.CUBCHOO,
    SpeciesId.GALAR_DARUMAKA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.SPHEAL,
    SpeciesId.DRILBUR,
    SpeciesId.SIGILYPH,
    SpeciesId.YAMASK,
    SpeciesId.ZORUA,
    SpeciesId.TYNAMO,
    SpeciesId.MIENFOO,
    SpeciesId.GOLETT,
    SpeciesId.PAWNIARD,
    SpeciesId.VULLABY,
    SpeciesId.DURANT,
    SpeciesId.BERGMITE,
    SpeciesId.EISCUE,
    SpeciesId.ALOLA_SANDSHREW,
    SpeciesId.HISUI_ZORUA,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DEINO, SpeciesId.FRIGIBAX, SpeciesId.HISUI_BRAVIARY],
};

const PLASMA_COLRESS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.MAGNEMITE,
    SpeciesId.GRIMER,
    SpeciesId.VOLTORB,
    SpeciesId.PORYGON,
    SpeciesId.BRONZOR,
    SpeciesId.ROTOM,
    SpeciesId.MUNNA,
    SpeciesId.DWEBBLE,
    SpeciesId.FERROSEED,
    SpeciesId.ELGYEM,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.BELDUM,
    SpeciesId.SIGILYPH,
    SpeciesId.TIRTOUGA,
    SpeciesId.ARCHEN,
    SpeciesId.TYNAMO,
    SpeciesId.GOLETT,
    SpeciesId.BLIPBUG,
    SpeciesId.VAROOM,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.HISUI_VOLTORB,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.ELEKID, SpeciesId.MAGBY, SpeciesId.PAWNIARD, SpeciesId.DURALUDON],
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
    SpeciesId.SLOWPOKE,
    SpeciesId.MAGNEMITE,
    SpeciesId.EXEGGUTOR,
    SpeciesId.NATU,
    SpeciesId.BALTOY,
    SpeciesId.MIME_JR,
    SpeciesId.ELGYEM,
    SpeciesId.INKAY,
    SpeciesId.BRUXISH,
    SpeciesId.BLIPBUG,
    SpeciesId.ALOLA_RAICHU,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.RALTS,
    SpeciesId.MEDITITE,
    SpeciesId.BELDUM,
    SpeciesId.SOLOSIS,
    SpeciesId.HATENNA,
    SpeciesId.STANTLER,
    SpeciesId.GIRAFARIG,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.PORYGON, SpeciesId.ARMAROUGE],
};

const SKULL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GASTLY,
    SpeciesId.KOFFING,
    SpeciesId.ZUBAT,
    SpeciesId.VENONAT,
    SpeciesId.STUNKY,
    SpeciesId.CROAGUNK,
    SpeciesId.VENIPEDE,
    SpeciesId.SCRAGGY,
    SpeciesId.MAREANIE,
    SpeciesId.FOMANTIS,
    SpeciesId.ALOLA_GRIMER,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.NIDORAN_F,
    SpeciesId.SKORUPI,
    SpeciesId.PAWNIARD,
    SpeciesId.VULLABY,
    SpeciesId.TOXEL,
    SpeciesId.GLIMMET,
    SpeciesId.PALDEA_WOOPER,
    SpeciesId.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.SKRELP, SpeciesId.HISUI_SNEASEL],
};

const MACRO_COSMOS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.VULPIX,
    SpeciesId.FEEBAS,
    SpeciesId.MAWILE,
    SpeciesId.FROSLASS,
    SpeciesId.GOTHITA,
    SpeciesId.FLABEBE,
    SpeciesId.SALANDIT,
    SpeciesId.TSAREENA,
    SpeciesId.SINISTEA,
    SpeciesId.HATENNA,
    SpeciesId.INDEEDEE,
    SpeciesId.GALAR_PONYTA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.TOGEPI,
    SpeciesId.VULLABY,
    SpeciesId.MAREANIE,
    SpeciesId.CUFANT,
    SpeciesId.TINKATINK,
    SpeciesId.ALOLA_VULPIX,
    SpeciesId.GALAR_CORSOLA,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.APPLIN, SpeciesId.HISUI_LILLIGANT],
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
    SpeciesId.MASCHIFF,
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
    SpeciesId.CAPSAKID,
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
    SpeciesId.GRAFAIAI,
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
    SpeciesId.TINKATINK,
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
    SpeciesId.FLAMIGO,
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
