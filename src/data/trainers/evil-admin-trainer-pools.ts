import type { TrainerTierPools } from "#app/data/trainers/typedefs";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { Species } from "#enums/species";

/** Team Rocket's admin trainer pool. */
const ROCKET: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.RATICATE,
    Species.ARBOK,
    Species.VILEPLUME,
    Species.ARCANINE,
    Species.GENGAR,
    Species.HYPNO,
    Species.ELECTRODE,
    Species.EXEGGUTOR,
    Species.CUBONE,
    Species.KOFFING,
    Species.GYARADOS,
    Species.CROBAT,
    Species.STEELIX,
    Species.HOUNDOOM,
    Species.HONCHKROW,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.OMASTAR,
    Species.KABUTOPS,
    Species.MAGNEZONE,
    Species.ELECTIVIRE,
    Species.MAGMORTAR,
    Species.PORYGON_Z,
    Species.ANNIHILAPE,
    Species.ALOLA_SANDSLASH,
    Species.ALOLA_PERSIAN,
    Species.ALOLA_GOLEM,
    Species.ALOLA_MUK,
    Species.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.RARE]: [Species.DRAGONITE, Species.TYRANITAR],
};

/** Team Magma's admin trainer pool */
const MAGMA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ARCANINE,
    Species.MAGCARGO,
    Species.HOUNDOOM,
    Species.TORKOAL,
    Species.SOLROCK,
    Species.CLAYDOL,
    Species.HIPPOWDON,
    Species.MAGMORTAR,
    Species.GLISCOR,
    Species.COALOSSAL,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.AGGRON,
    Species.FLYGON,
    Species.CRADILY,
    Species.ARMALDO,
    Species.RHYPERIOR,
    Species.TURTONATOR,
    Species.SANDACONDA,
    Species.TOEDSCRUEL,
    Species.HISUI_ARCANINE,
  ],
  [TrainerPoolTier.RARE]: [Species.CHARCADET, Species.SCOVILLAIN],
};

const AQUA: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.TENTACRUEL,
    Species.LANTURN,
    Species.AZUMARILL,
    Species.QUAGSIRE,
    Species.OCTILLERY,
    Species.LUDICOLO,
    Species.PELIPPER,
    Species.WAILORD,
    Species.WHISCASH,
    Species.CRAWDAUNT,
    Species.WALREIN,
    Species.CLAMPERL,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.QUAGSIRE,
    Species.MANTINE,
    Species.KINGDRA,
    Species.MILOTIC,
    Species.DRAGALGE,
    Species.DHELMISE,
    Species.BARRASKEWDA,
    Species.GRAPPLOCT,
    Species.OVERQWIL,
  ],
  [TrainerPoolTier.RARE]: [Species.BASCULEGION, Species.DONDOZO],
};

const GALACTIC: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ELECTRODE,
    Species.GYARADOS,
    Species.CROBAT,
    Species.HONCHKROW,
    Species.BRONZONG,
    Species.DRAPION,
    Species.LICKILICKY,
    Species.TANGROWTH,
    Species.ELECTIVIRE,
    Species.MAGMORTAR,
    Species.YANMEGA,
    Species.MAMOSWINE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.ALAKAZAM,
    Species.WEAVILE,
    Species.GLISCOR,
    Species.DUSKNOIR,
    Species.ROTOM,
    Species.OVERQWIL,
    Species.HISUI_ARCANINE,
    Species.HISUI_ELECTRODE,
  ],
  [TrainerPoolTier.RARE]: [Species.SPIRITOMB, Species.URSALUNA, Species.SNEASLER, Species.HISUI_LILLIGANT],
};

const PLASMA_ZINZOLAN: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.GIGALITH,
    Species.CONKELDURR,
    Species.SEISMITOAD,
    Species.KROOKODILE,
    Species.DARMANITAN,
    Species.COFAGRIGUS,
    Species.VANILLUXE,
    Species.AMOONGUSS,
    Species.JELLICENT,
    Species.GALVANTULA,
    Species.FERROTHORN,
    Species.BEARTIC,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.EXCADRILL,
    Species.SIGILYPH,
    Species.ZOROARK,
    Species.KLINKLANG,
    Species.EELEKTROSS,
    Species.MIENSHAO,
    Species.GOLURK,
    Species.BISHARP,
    Species.MANDIBUZZ,
    Species.DURANT,
    Species.GALAR_DARMANITAN,
  ],
  [TrainerPoolTier.RARE]: [Species.HAXORUS, Species.HYDREIGON, Species.HISUI_ZOROARK, Species.HISUI_BRAVIARY],
};

const PLASMA_COLRESS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.MUK,
    Species.ELECTRODE,
    Species.BRONZONG,
    Species.MAGNEZONE,
    Species.PORYGON_Z,
    Species.MUSHARNA,
    Species.REUNICLUS,
    Species.GALVANTULA,
    Species.FERROTHORN,
    Species.EELEKTROSS,
    Species.BEHEEYEM,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.METAGROSS,
    Species.ROTOM,
    Species.CARRACOSTA,
    Species.ARCHEOPS,
    Species.GOLURK,
    Species.DURANT,
    Species.VIKAVOLT,
    Species.ORBEETLE,
    Species.REVAVROOM,
    Species.ALOLA_MUK,
    Species.HISUI_ELECTRODE,
  ],
  [TrainerPoolTier.RARE]: [Species.ELECTIVIRE, Species.MAGMORTAR, Species.BISHARP, Species.ARCHALUDON],
};

const FLARE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.MANECTRIC,
    Species.DRAPION,
    Species.LIEPARD,
    Species.AMOONGUSS,
    Species.DIGGERSBY,
    Species.TALONFLAME,
    Species.PYROAR,
    Species.PANGORO,
    Species.MEOWSTIC,
    Species.MALAMAR,
    Species.CLAWITZER,
    Species.HELIOLISK,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.HOUNDOOM,
    Species.WEAVILE,
    Species.CHANDELURE,
    Species.AEGISLASH,
    Species.BARBARACLE,
    Species.DRAGALGE,
    Species.GOODRA,
    Species.TREVENANT,
    Species.GOURGEIST,
  ],
  [TrainerPoolTier.RARE]: [Species.NOIVERN, Species.HISUI_GOODRA, Species.HISUI_AVALUGG],
};

const AETHER: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ALAKAZAM,
    Species.SLOWBRO,
    Species.EXEGGUTOR,
    Species.XATU,
    Species.CLAYDOL,
    Species.BEHEEYEM,
    Species.ORANGURU,
    Species.BRUXISH,
    Species.ORBEETLE,
    Species.FARIGIRAF,
    Species.ALOLA_RAICHU,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.KIRLIA,
    Species.MEDICHAM,
    Species.METAGROSS,
    Species.MALAMAR,
    Species.HATTERENE,
    Species.MR_RIME,
    Species.GALAR_SLOWKING,
  ],
  [TrainerPoolTier.RARE]: [Species.PORYGON_Z, Species.ARMAROUGE, Species.HISUI_BRAVIARY],
};

const SKULL: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.NIDOQUEEN,
    Species.GENGAR,
    Species.KOFFING,
    Species.CROBAT,
    Species.ROSERADE,
    Species.SKUNTANK,
    Species.TOXICROAK,
    Species.SCOLIPEDE,
    Species.TOXAPEX,
    Species.LURANTIS,
    Species.ALOLA_MUK,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.DRAPION,
    Species.MANDIBUZZ,
    Species.OVERQWIL,
    Species.GLIMMORA,
    Species.CLODSIRE,
    Species.GALAR_SLOWBRO,
  ],
  [TrainerPoolTier.RARE]: [Species.DRAGALGE, Species.SNEASLER],
};

const MACRO_COSMOS: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.NINETALES,
    Species.BELLOSSOM,
    Species.MILOTIC,
    Species.FROSLASS,
    Species.GOTHITELLE,
    Species.JELLICENT,
    Species.SALAZZLE,
    Species.TSAREENA,
    Species.POLTEAGEIST,
    Species.HATTERENE,
    Species.GALAR_RAPIDASH,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.TOGEKISS,
    Species.MANDIBUZZ,
    Species.TOXAPEX,
    Species.APPLETUN,
    Species.CURSOLA,
    Species.ALOLA_NINETALES,
  ],
  [TrainerPoolTier.RARE]: [Species.TINKATON, Species.HISUI_LILLIGANT],
};

const STAR_DARK: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.SHIFTRY,
    Species.CACTURNE,
    Species.HONCHKROW,
    Species.SKUNTANK,
    Species.KROOKODILE,
    Species.OBSTAGOON,
    Species.LOKIX,
    Species.MABOSSTIFF,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.UMBREON,
    Species.CRAWDAUNT,
    Species.WEAVILE,
    Species.ZOROARK,
    Species.MALAMAR,
    Species.BOMBIRDIER,
  ],
  [TrainerPoolTier.RARE]: [Species.HYDREIGON, Species.MEOWSCARADA],
};

const STAR_FIRE: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.ARCANINE,
    Species.HOUNDOOM,
    Species.CAMERUPT,
    Species.CHANDELURE,
    Species.TALONFLAME,
    Species.PYROAR,
    Species.COALOSSAL,
    Species.SCOVILLAIN,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.RAPIDASH,
    Species.FLAREON,
    Species.TORKOAL,
    Species.MAGMORTAR,
    Species.SALAZZLE,
    Species.TURTONATOR,
  ],
  [TrainerPoolTier.RARE]: [Species.VOLCARONA, Species.SKELEDIRGE],
};

const STAR_POISON: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.MUK,
    Species.CROBAT,
    Species.SKUNTANK,
    Species.AMOONGUSS,
    Species.TOXAPEX,
    Species.TOXTRICITY,
    Species.GRAFAIAI,
    Species.CLODSIRE,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.GENGAR,
    Species.SEVIPER,
    Species.DRAGALGE,
    Species.OVERQWIL,
    Species.ALOLA_MUK,
    Species.GALAR_SLOWBRO,
  ],
  [TrainerPoolTier.RARE]: [Species.GLIMMORA, Species.VENUSAUR],
};

const STAR_FAIRY: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.CLEFABLE,
    Species.WIGGLYTUFF,
    Species.AZUMARILL,
    Species.WHIMSICOTT,
    Species.FLORGES,
    Species.HATTERENE,
    Species.GRIMMSNARL,
    Species.TINKATON,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.TOGEKISS,
    Species.GARDEVOIR,
    Species.SYLVEON,
    Species.KLEFKI,
    Species.MIMIKYU,
    Species.ALOLA_NINETALES,
  ],
  [TrainerPoolTier.RARE]: [Species.GALAR_RAPIDASH, Species.PRIMARINA],
};

const STAR_FIGHTING: TrainerTierPools = {
  [TrainerPoolTier.COMMON]: [
    Species.BRELOOM,
    Species.HARIYAMA,
    Species.MEDICHAM,
    Species.TOXICROAK,
    Species.SCRAFTY,
    Species.MIENSHAO,
    Species.PAWMOT,
    Species.PALDEA_TAUROS,
  ],
  [TrainerPoolTier.UNCOMMON]: [
    Species.LUCARIO,
    Species.CONKELDURR,
    Species.HAWLUCHA,
    Species.PASSIMIAN,
    Species.FALINKS,
    Species.FLAMIGO,
  ],
  [TrainerPoolTier.RARE]: [Species.KOMMO_O, Species.QUAQUAVAL],
};

export type EvilTeam =
  | "rocket"
  | "magma"
  | "aqua"
  | "galactic"
  | "plasma_zinzolan"
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
  plasma_zinzolan: PLASMA_ZINZOLAN,
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
