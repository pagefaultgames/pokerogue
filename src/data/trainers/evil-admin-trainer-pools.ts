import { SpeciesId } from "#enums/species-id";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import type { TrainerTierPools } from "#types/trainer-funcs";

/** Team Rocket's admin trainer pool. */
const ROCKET_PETREL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SPEAROW,
    SpeciesId.ZUBAT,
    SpeciesId.DIGLETT,
    SpeciesId.GEODUDE,
    SpeciesId.DROWZEE,
    SpeciesId.VOLTORB,
    SpeciesId.EXEGGCUTE,
    SpeciesId.TANGELA,
    SpeciesId.PINECO,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.MAGNEMITE,
    SpeciesId.SHELLDER,
    SpeciesId.OMANYTE,
    SpeciesId.QWILFISH,
    SpeciesId.ALOLA_GEODUDE,
    SpeciesId.HISUI_VOLTORB,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.MAGIKARP],
};

const ROCKET_ARCHER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.ZUBAT,
    SpeciesId.VENONAT,
    SpeciesId.BELLSPROUT,
    SpeciesId.GRIMER,
    SpeciesId.DROWZEE,
    SpeciesId.CUBONE,
    SpeciesId.TAUROS,
    SpeciesId.MISDREAVUS,
    SpeciesId.WYNAUT,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.ABRA,
    SpeciesId.ONIX,
    SpeciesId.MAGIKARP,
    SpeciesId.SNEASEL,
    SpeciesId.ELEKID,
    SpeciesId.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.LARVITAR],
};

const ROCKET_ARIANA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.WEEDLE,
    SpeciesId.ZUBAT,
    SpeciesId.GROWLITHE,
    SpeciesId.KOFFING,
    SpeciesId.LICKITUNG,
    SpeciesId.SMOOCHUM,
    SpeciesId.SNUBBULL,
    SpeciesId.MISDREAVUS,
    SpeciesId.SLUGMA,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.SCYTHER,
    SpeciesId.MAGIKARP,
    SpeciesId.PORYGON,
    SpeciesId.KABUTO,
    SpeciesId.ALOLA_RATTATA,
    SpeciesId.ALOLA_MEOWTH,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.LAPRAS],
};

const ROCKET_PROTON: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SANDSHREW,
    SpeciesId.PARAS,
    SpeciesId.MANKEY,
    SpeciesId.POLIWAG,
    [SpeciesId.SLOWPOKE, SpeciesId.GALAR_SLOWPOKE],
    SpeciesId.KANGASKHAN,
    SpeciesId.PINSIR,
    SpeciesId.DUNSPARCE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.GASTLY,
    SpeciesId.MAGIKARP,
    SpeciesId.AERODACTYL,
    SpeciesId.MAGBY,
    SpeciesId.ALOLA_SANDSHREW,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.GALAR_SLOWPOKE,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DRATINI],
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
    [SpeciesId.LILEEP, SpeciesId.ANORITH],
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
    SpeciesId.MANTYKE,
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
    [SpeciesId.OMANYTE, SpeciesId.KABUTO],
    SpeciesId.CROAGUNK,
    SpeciesId.BINACLE,
    SpeciesId.SKRELP,
    SpeciesId.WIMPOD,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.BASCULEGION],
};

const GALACTIC_MARS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.MAGNEMITE,
    SpeciesId.KANGASKHAN,
    SpeciesId.DRIFLOON,
    SpeciesId.SHELLOS,
    SpeciesId.CHINGLING,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.PORYGON, SpeciesId.TOGEPI, SpeciesId.ELEKID, SpeciesId.MISDREAVUS],
  [TrainerPoolTier.RARE]: [SpeciesId.HISUI_LILLIGANT],
};

const GALACTIC_JUPITER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SABLEYE,
    SpeciesId.BUDEW,
    SpeciesId.COMBEE,
    SpeciesId.SHELLOS,
    SpeciesId.NOSEPASS,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.GLIGAR, SpeciesId.SWINUB, SpeciesId.DUSKULL, SpeciesId.SNOVER],
  [TrainerPoolTier.RARE]: [SpeciesId.HISUI_SNEASEL],
};

const GALACTIC_SATURN: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [SpeciesId.ZUBAT, SpeciesId.AIPOM, SpeciesId.OCTILLERY, SpeciesId.ABSOL, SpeciesId.SKORUPI],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.RHYHORN, SpeciesId.MAGBY, SpeciesId.GALLADE, SpeciesId.SPIRITOMB],
  [TrainerPoolTier.RARE]: [SpeciesId.OVERQWIL],
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
    [SpeciesId.TIRTOUGA, SpeciesId.ARCHEN],
    SpeciesId.TYNAMO,
    SpeciesId.VAROOM,
    SpeciesId.ALOLA_GRIMER,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.DURALUDON],
};

const FLARE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.FOONGUS,
    SpeciesId.SCRAGGY,
    SpeciesId.DRUDDIGON,
    SpeciesId.BUNNELBY,
    SpeciesId.FLETCHLING,
    SpeciesId.PANCHAM,
    SpeciesId.ESPURR,
    SpeciesId.PUMPKABOO,
    SpeciesId.PHANTUMP,
    SpeciesId.CLAUNCHER,
    SpeciesId.HELIOPTILE,
    SpeciesId.KLEFKI,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.LITWICK,
    SpeciesId.HEATMOR,
    SpeciesId.BINACLE,
    SpeciesId.SKRELP,
    SpeciesId.BERGMITE,
    SpeciesId.CAPSAKID,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.GOODRA, SpeciesId.HONEDGE],
};

const FLARE_XEROSIC: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.PANCHAM,
    SpeciesId.BINACLE,
    SpeciesId.HELIOPTILE,
    SpeciesId.CLAUNCHER,
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
    [SpeciesId.AMAURA, SpeciesId.TYRUNT],
    SpeciesId.SNEASEL,
    SpeciesId.LITWICK,
    SpeciesId.LITLEO,
    SpeciesId.BINACLE,
    SpeciesId.SKRELP,
    SpeciesId.NOIBAT,
    SpeciesId.PHANTUMP,
    SpeciesId.PUMPKABOO,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.HISUI_GOODRA, SpeciesId.HONEDGE],
};

const AETHER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.ABRA,
    SpeciesId.SLOWPOKE,
    SpeciesId.MR_MIME,
    SpeciesId.NATU,
    SpeciesId.MEDITITE,
    SpeciesId.BALTOY,
    SpeciesId.INKAY,
    SpeciesId.EXEGGCUTE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.PORYGON,
    [SpeciesId.STANTLER, SpeciesId.GIRAFARIG],
    SpeciesId.SOLOSIS,
    SpeciesId.HATENNA,
    SpeciesId.ALOLA_GRIMER,
    SpeciesId.GALAR_SLOWKING,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.BELDUM],
};

const SKULL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.VENONAT,
    SpeciesId.GASTLY,
    SpeciesId.ZUBAT,
    SpeciesId.CROAGUNK,
    SpeciesId.VENIPEDE,
    SpeciesId.FOMANTIS,
    SpeciesId.TOXEL,
    SpeciesId.PALDEA_WOOPER,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.NIDORAN_F,
    SpeciesId.SKORUPI,
    SpeciesId.VULLABY,
    SpeciesId.SKRELP,
    SpeciesId.GLIMMET,
    SpeciesId.GALAR_SLOWBRO,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.HISUI_SNEASEL],
};

const MACRO_COSMOS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SMOOCHUM,
    SpeciesId.MAWILE,
    SpeciesId.VESPIQUEN,
    SpeciesId.FROSLASS,
    SpeciesId.GOTHITA,
    SpeciesId.SPRITZEE,
    SpeciesId.SALANDIT,
    SpeciesId.INDEEDEE,
    SpeciesId.HATENNA,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.VULLABY, SpeciesId.FLABEBE, SpeciesId.TINKATINK, SpeciesId.GALAR_PONYTA],
  [TrainerPoolTier.RARE]: [SpeciesId.HYDRAPPLE],
};

const STAR_DARK: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.MURKROW,
    SpeciesId.SABLEYE,
    SpeciesId.CACNEA,
    SpeciesId.CORPHISH,
    SpeciesId.STUNKY,
    SpeciesId.SANDILE,
    SpeciesId.NYMBLE,
    SpeciesId.BOMBIRDIER,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.SNEASEL, SpeciesId.SPIRITOMB, SpeciesId.ZORUA, SpeciesId.GALAR_ZIGZAGOON],
  [TrainerPoolTier.RARE]: [SpeciesId.SPRIGATITO],
};

const STAR_FIRE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.GROWLITHE,
    SpeciesId.HOUNDOUR,
    SpeciesId.NUMEL,
    SpeciesId.TORKOAL,
    SpeciesId.FLETCHLING,
    SpeciesId.LITLEO,
    SpeciesId.ORICORIO,
    SpeciesId.ROLYCOLY,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.DARUMAKA, SpeciesId.TURTONATOR, SpeciesId.SIZZLIPEDE, SpeciesId.CERULEDGE],
  [TrainerPoolTier.RARE]: [SpeciesId.FUECOCO],
};

const STAR_POISON: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.VENONAT,
    SpeciesId.GRIMER,
    SpeciesId.GULPIN,
    SpeciesId.SEVIPER,
    SpeciesId.STUNKY,
    SpeciesId.FOONGUS,
    SpeciesId.MAREANIE,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.GASTLY, SpeciesId.SALAZZLE, SpeciesId.GLIMMET, SpeciesId.PALDEA_WOOPER],
  [TrainerPoolTier.RARE]: [SpeciesId.BULBASAUR],
};

const STAR_FAIRY: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.CLEFFA,
    SpeciesId.IGGLYBUFF,
    SpeciesId.MR_MIME,
    SpeciesId.AZURILL,
    SpeciesId.DEDENNE,
    SpeciesId.KLEFKI,
    SpeciesId.HATENNA,
    SpeciesId.IMPIDIMP,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    SpeciesId.RALTS,
    SpeciesId.FLABEBE,
    SpeciesId.MIMIKYU,
    SpeciesId.MIMIKYU,
    SpeciesId.ALOLA_VULPIX,
  ],
  [TrainerPoolTier.RARE]: [SpeciesId.POPPLIO],
};

const STAR_FIGHTING: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    SpeciesId.SHROOMISH,
    SpeciesId.MAKUHITA,
    [SpeciesId.MEDITITE, SpeciesId.GALLADE],
    SpeciesId.RIOLU,
    SpeciesId.CROAGUNK,
    SpeciesId.PASSIMIAN,
    SpeciesId.FALINKS,
    SpeciesId.PAWMI,
  ],
  [TrainerPoolTier.UNCOMMON]: [SpeciesId.HERACROSS, SpeciesId.HAWLUCHA, SpeciesId.CRABRAWLER, SpeciesId.PALDEA_TAUROS],
  [TrainerPoolTier.RARE]: [SpeciesId.QUAXLY],
};

export type EvilTeam =
  | "rocket_petrel"
  | "rocket_archer"
  | "rocket_ariana"
  | "rocket_proton"
  | "magma"
  | "aqua"
  | "galactic_mars"
  | "galactic_jupiter"
  | "galactic_saturn"
  | "plasma_zinzolin"
  | "plasma_colress"
  | "flare"
  | "flare_xerosic"
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
  rocket_petrel: ROCKET_PETREL,
  rocket_archer: ROCKET_ARCHER,
  rocket_ariana: ROCKET_ARIANA,
  rocket_proton: ROCKET_PROTON,
  magma: MAGMA,
  aqua: AQUA,
  galactic_mars: GALACTIC_MARS,
  galactic_jupiter: GALACTIC_JUPITER,
  galactic_saturn: GALACTIC_SATURN,
  plasma_zinzolin: PLASMA_ZINZOLIN,
  plasma_colress: PLASMA_COLRESS,
  flare: FLARE,
  flare_xerosic: FLARE_XEROSIC,
  aether: AETHER,
  macro_cosmos: MACRO_COSMOS,
  skull: SKULL,
  star_dark: STAR_DARK,
  star_fire: STAR_FIRE,
  star_poison: STAR_POISON,
  star_fairy: STAR_FAIRY,
  star_fighting: STAR_FIGHTING,
};
