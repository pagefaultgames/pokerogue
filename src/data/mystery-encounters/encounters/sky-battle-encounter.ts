import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  type EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectOptionThenPokemon,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "../utils/encounter-phase-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import {
  AbilityRequirement,
  AnyCombinationPokemonRequirement,
  CombinationPokemonRequirement,
  FormPokemonRequirement,
  SpeciesRequirement,
  TypeRequirement,
} from "../mystery-encounter-requirements";
import { PokemonType } from "#enums/pokemon-type";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { isNullOrUndefined, randSeedInt, randSeedShuffle } from "#app/utils/common";
import type { PlayerPokemon } from "#app/field/pokemon";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import i18next from "i18next";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import { showEncounterDialogue } from "../utils/encounter-dialogue-utils";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { allMoves, modifierTypes } from "#app/data/data-lists";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { TrainerPartyTemplate } from "#app/data/trainers/TrainerPartyTemplate";
import { getRandomPartyMemberFunc, type TrainerConfig, trainerConfigs } from "#app/data/trainers/trainer-config";
import { TrainerType } from "#enums/trainer-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { TrainerSlot } from "#enums/trainer-slot";
import { SpeciesFormKey } from "#enums/species-form-key";

/** The i18n namespace for the encounter */
const namespace = "mysteryEncounters/skyBattle";

const SKY_BATTLE_WAVES: [number, number] = [50, 180];

const POOL_ALL_FORMS = [
  SpeciesId.BUTTERFREE,
  SpeciesId.BEEDRILL,
  SpeciesId.PIDGEY,
  SpeciesId.PIDGEOTTO,
  SpeciesId.PIDGEOT,
  SpeciesId.SPEAROW,
  SpeciesId.FEAROW,
  SpeciesId.ZUBAT,
  SpeciesId.GOLBAT,
  SpeciesId.VENOMOTH,
  SpeciesId.MAGNEMITE,
  SpeciesId.MAGNETON,
  SpeciesId.GASTLY,
  SpeciesId.HAUNTER,
  SpeciesId.GENGAR,
  SpeciesId.KOFFING,
  SpeciesId.WEEZING,
  SpeciesId.SCYTHER,
  SpeciesId.GYARADOS,
  SpeciesId.PORYGON,
  SpeciesId.AERODACTYL,
  SpeciesId.ARTICUNO,
  SpeciesId.ZAPDOS,
  SpeciesId.MOLTRES,
  SpeciesId.DRAGONITE,
  SpeciesId.MEWTWO,
  SpeciesId.MEW,
  SpeciesId.HOOTHOOT,
  SpeciesId.NOCTOWL,
  SpeciesId.LEDYBA,
  SpeciesId.LEDIAN,
  SpeciesId.CROBAT,
  SpeciesId.TOGETIC,
  SpeciesId.NATU,
  SpeciesId.XATU,
  SpeciesId.HOPPIP,
  SpeciesId.SKIPLOOM,
  SpeciesId.JUMPLUFF,
  SpeciesId.YANMA,
  SpeciesId.MURKROW,
  SpeciesId.MISDREAVUS,
  SpeciesId.UNOWN, // ALL (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, !, ?)
  SpeciesId.GLIGAR,
  SpeciesId.DELIBIRD,
  SpeciesId.MANTINE,
  SpeciesId.SKARMORY,
  SpeciesId.PORYGON2,
  SpeciesId.LUGIA,
  SpeciesId.HO_OH,
  SpeciesId.CELEBI,
  SpeciesId.BEAUTIFLY,
  SpeciesId.DUSTOX,
  SpeciesId.TAILLOW,
  SpeciesId.SWELLOW,
  SpeciesId.WINGULL,
  SpeciesId.PELIPPER,
  SpeciesId.MASQUERAIN,
  SpeciesId.NINJASK,
  SpeciesId.SHEDINJA,
  SpeciesId.VOLBEAT,
  SpeciesId.ILLUMISE,
  SpeciesId.VIBRAVA,
  SpeciesId.FLYGON,
  SpeciesId.SWABLU,
  SpeciesId.ALTARIA,
  SpeciesId.LUNATONE,
  SpeciesId.SOLROCK,
  SpeciesId.BALTOY,
  SpeciesId.CLAYDOL,
  SpeciesId.CASTFORM, // ALL (Normal, Sunny, Rainy, Snowy)
  SpeciesId.DUSKULL,
  SpeciesId.TROPIUS,
  SpeciesId.CHIMECHO,
  SpeciesId.GLALIE,
  SpeciesId.SALAMENCE,
  SpeciesId.BELDUM,
  SpeciesId.METANG,
  SpeciesId.LATIAS,
  SpeciesId.LATIOS,
  SpeciesId.RAYQUAZA,
  SpeciesId.JIRACHI,
  SpeciesId.DEOXYS, // ALL (Normal, Attack, Defense, Speed)
  SpeciesId.STARLY,
  SpeciesId.STARAVIA,
  SpeciesId.STARAPTOR,
  SpeciesId.MOTHIM,
  SpeciesId.COMBEE,
  SpeciesId.VESPIQUEN,
  SpeciesId.DRIFLOON,
  SpeciesId.DRIFBLIM,
  SpeciesId.MISMAGIUS,
  SpeciesId.HONCHKROW,
  SpeciesId.CHINGLING,
  SpeciesId.BRONZOR,
  SpeciesId.BRONZONG,
  SpeciesId.CHATOT,
  SpeciesId.CARNIVINE,
  SpeciesId.MANTYKE,
  SpeciesId.MAGNEZONE,
  SpeciesId.TOGEKISS,
  SpeciesId.YANMEGA,
  SpeciesId.GLISCOR,
  SpeciesId.PORYGON_Z,
  SpeciesId.PROBOPASS,
  SpeciesId.DUSKNOIR,
  SpeciesId.FROSLASS,
  SpeciesId.ROTOM, // ALL (Normal, Heat, Wash, Frost, Fan, Mow)
  SpeciesId.UXIE,
  SpeciesId.MESPRIT,
  SpeciesId.AZELF,
  SpeciesId.DIALGA,
  SpeciesId.PALKIA,
  SpeciesId.GIRATINA,
  SpeciesId.CRESSELIA,
  SpeciesId.DARKRAI,
  SpeciesId.ARCEUS, // ALL (Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel, Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark, Fairy)
  SpeciesId.PIDOVE,
  SpeciesId.TRANQUILL,
  SpeciesId.UNFEZANT,
  SpeciesId.WOOBAT,
  SpeciesId.SWOOBAT,
  SpeciesId.SIGILYPH,
  SpeciesId.ARCHEOPS,
  SpeciesId.SOLOSIS,
  SpeciesId.DUOSION,
  SpeciesId.REUNICLUS,
  SpeciesId.DUCKLETT,
  SpeciesId.SWANNA,
  SpeciesId.VANILLITE,
  SpeciesId.VANILLISH,
  SpeciesId.VANILLUXE,
  SpeciesId.EMOLGA,
  SpeciesId.KLINK,
  SpeciesId.KLANG,
  SpeciesId.KLINKLANG,
  SpeciesId.TYNAMO,
  SpeciesId.EELEKTRIK,
  SpeciesId.EELEKTROSS,
  SpeciesId.ELGYEM,
  SpeciesId.BEHEEYEM,
  SpeciesId.LAMPENT,
  SpeciesId.CHANDELURE,
  SpeciesId.CRYOGONAL,
  SpeciesId.RUFFLET,
  SpeciesId.BRAVIARY,
  SpeciesId.MANDIBUZZ,
  SpeciesId.HYDREIGON,
  SpeciesId.VOLCARONA,
  SpeciesId.TORNADUS,
  SpeciesId.THUNDURUS,
  SpeciesId.RESHIRAM,
  SpeciesId.ZEKROM,
  SpeciesId.LANDORUS,
  SpeciesId.FLETCHLING,
  SpeciesId.FLETCHINDER,
  SpeciesId.TALONFLAME,
  SpeciesId.VIVILLON, // ALL (Meadow, Icy Snow, Polar, Tundra, Continental, Garden, Elegant, Modern, Marine, Archipelago, High Plains, Sandstorm, River, Monsoon, Savanna, Sun, Ocean, Jungle, Fancy, Poke Ball)
  SpeciesId.HAWLUCHA,
  SpeciesId.KLEFKI,
  SpeciesId.NOIBAT,
  SpeciesId.NOIVERN,
  SpeciesId.YVELTAL,
  SpeciesId.HOOPA,
  SpeciesId.ROWLET,
  SpeciesId.DARTRIX,
  SpeciesId.PIKIPEK,
  SpeciesId.TRUMBEAK,
  SpeciesId.TOUCANNON,
  SpeciesId.VIKAVOLT,
  SpeciesId.ORICORIO, // ALL (Baile, Pompom, Pau, Sensu)
  SpeciesId.CUTIEFLY,
  SpeciesId.RIBOMBEE,
  SpeciesId.COMFEY,
  SpeciesId.MINIOR, // ALL (Red, Orange, Yellow, Green, Blue, Indigo, Violet and Meteors)
  SpeciesId.TAPU_KOKO,
  SpeciesId.TAPU_LELE,
  SpeciesId.TAPU_BULU,
  SpeciesId.TAPU_FINI,
  SpeciesId.COSMOG,
  SpeciesId.COSMOEM,
  SpeciesId.SOLGALEO,
  SpeciesId.LUNALA,
  SpeciesId.NIHILEGO,
  SpeciesId.BUZZWOLE,
  SpeciesId.CELESTEELA,
  SpeciesId.KARTANA,
  SpeciesId.NECROZMA, // ALL (Dusk Mane, Dawn Wings, Ultra)
  SpeciesId.POIPOLE,
  SpeciesId.NAGANADEL,
  SpeciesId.ROOKIDEE,
  SpeciesId.CORVISQUIRE,
  SpeciesId.CORVIKNIGHT,
  SpeciesId.ORBEETLE,
  SpeciesId.FLAPPLE,
  SpeciesId.CRAMORANT,
  SpeciesId.SINISTEA,
  SpeciesId.POLTEAGEIST,
  SpeciesId.FROSMOTH,
  SpeciesId.DREEPY,
  SpeciesId.DRAKLOAK,
  SpeciesId.DRAGAPULT,
  SpeciesId.ETERNATUS,
  SpeciesId.REGIELEKI,
  SpeciesId.REGIDRAGO,
  SpeciesId.CALYREX,
  SpeciesId.ENAMORUS,
  SpeciesId.SQUAWKABILLY, // ALL (Green, Blue, Yellow, White)
  SpeciesId.WATTREL,
  SpeciesId.KILOWATTREL,
  SpeciesId.RABSCA,
  SpeciesId.BOMBIRDIER,
  SpeciesId.VAROOM,
  SpeciesId.REVAVROOM,
  SpeciesId.GLIMMET,
  SpeciesId.GLIMMORA,
  SpeciesId.FLAMIGO,
  SpeciesId.SCREAM_TAIL,
  SpeciesId.FLUTTER_MANE,
  SpeciesId.IRON_JUGULIS,
  SpeciesId.IRON_MOTH,
  SpeciesId.CHI_YU,
  SpeciesId.ROARING_MOON,
  SpeciesId.MIRAIDON,
  SpeciesId.POLTCHAGEIST,
  SpeciesId.SINISTCHA,
  SpeciesId.FEZANDIPITI,
  SpeciesId.PECHARUNT,
  SpeciesId.ALOLA_RAICHU,
  SpeciesId.GALAR_WEEZING,
  SpeciesId.GALAR_ARTICUNO,
  SpeciesId.GALAR_MOLTRES,
  SpeciesId.HISUI_BRAVIARY,
];
const POOL_BASEFORM = [SpeciesId.CHARIZARD];
const POOL_ARIA = [
  SpeciesId.MELOETTA, // ARIA
];
const POOL_MEGA = [SpeciesId.ALAKAZAM, SpeciesId.PINSIR, SpeciesId.METAGROSS];
const POOL_MEGA_X = [SpeciesId.CHARIZARD];
const POOL_MEGA_Y = [SpeciesId.CHARIZARD];
const POOL_SKY = [SpeciesId.SHAYMIN];
const POOL_BLACK = [SpeciesId.KYUREM];
const POOL_WHITE = [SpeciesId.KYUREM];

// trainer pools
const WEAK_TIER = [
  SpeciesId.PIDGEY,
  SpeciesId.SPEAROW,
  SpeciesId.ZUBAT,
  SpeciesId.MAGNEMITE,
  SpeciesId.GASTLY,
  SpeciesId.KOFFING,
  SpeciesId.PORYGON,
  SpeciesId.HOOTHOOT,
  SpeciesId.LEDYBA,
  SpeciesId.NATU,
  SpeciesId.HOPPIP,
  SpeciesId.SKIPLOOM,
  SpeciesId.YANMA,
  SpeciesId.MURKROW,
  SpeciesId.MISDREAVUS,
  SpeciesId.UNOWN,
  SpeciesId.GLIGAR,
  SpeciesId.DELIBIRD,
  SpeciesId.TAILLOW,
  SpeciesId.WINGULL,
  SpeciesId.SHEDINJA,
  SpeciesId.VOLBEAT,
  SpeciesId.ILLUMISE,
  SpeciesId.SWABLU,
  SpeciesId.BALTOY,
  SpeciesId.CASTFORM,
  SpeciesId.DUSKULL,
  SpeciesId.BELDUM,
  SpeciesId.STARLY,
  SpeciesId.COMBEE,
  SpeciesId.DRIFLOON,
  SpeciesId.CHINGLING,
  SpeciesId.BRONZOR,
  SpeciesId.CHATOT,
  SpeciesId.MANTYKE,
  SpeciesId.PIDOVE,
  SpeciesId.WOOBAT,
  SpeciesId.SOLOSIS,
  SpeciesId.DUCKLETT,
  SpeciesId.VANILLITE,
  SpeciesId.EMOLGA,
  SpeciesId.KLINK,
  SpeciesId.TYNAMO,
  SpeciesId.ELGYEM,
  SpeciesId.RUFFLET,
  SpeciesId.FLETCHLING,
  SpeciesId.KLEFKI,
  SpeciesId.NOIBAT,
  SpeciesId.ROWLET,
  SpeciesId.PIKIPEK,
  SpeciesId.CUTIEFLY,
  SpeciesId.COMFEY,
  SpeciesId.MINIOR,
  SpeciesId.COSMOG,
  SpeciesId.POIPOLE,
  SpeciesId.ROOKIDEE,
  SpeciesId.SINISTEA,
  SpeciesId.DREEPY,
  SpeciesId.SQUAWKABILLY,
  SpeciesId.WATTREL,
  SpeciesId.VAROOM,
  SpeciesId.GLIMMET,
  SpeciesId.POLTCHAGEIST,
];

const MID_TIER = [
  {
    species: SpeciesId.BUTTERFREE,
    formIndex: 0,
  },
  {
    species: SpeciesId.BEEDRILL,
    formIndex: 0,
  },
  {
    species: SpeciesId.PIDGEOTTO,
    formIndex: 0,
  },
  {
    species: SpeciesId.PIDGEOT,
    formIndex: 0,
  },
  {
    species: SpeciesId.FEAROW,
    formIndex: 0,
  },
  {
    species: SpeciesId.GOLBAT,
    formIndex: 0,
  },
  {
    species: SpeciesId.VENOMOTH,
    formIndex: 0,
  },
  {
    species: SpeciesId.MAGNETON,
    formIndex: 0,
  },
  {
    species: SpeciesId.HAUNTER,
    formIndex: 0,
  },
  {
    species: SpeciesId.WEEZING,
    formIndex: 0,
  },
  {
    species: SpeciesId.SCYTHER,
    formIndex: 0,
  },
  {
    species: SpeciesId.NOCTOWL,
    formIndex: 0,
  },
  {
    species: SpeciesId.LEDIAN,
    formIndex: 0,
  },
  {
    species: SpeciesId.CROBAT,
    formIndex: 0,
  },
  {
    species: SpeciesId.TOGETIC,
    formIndex: 0,
  },
  {
    species: SpeciesId.XATU,
    formIndex: 0,
  },
  {
    species: SpeciesId.JUMPLUFF,
    formIndex: 0,
  },
  {
    species: SpeciesId.MANTINE,
    formIndex: 0,
  },
  {
    species: SpeciesId.SKARMORY,
    formIndex: 0,
  },
  {
    species: SpeciesId.PORYGON2,
    formIndex: 0,
  },
  {
    species: SpeciesId.BEAUTIFLY,
    formIndex: 0,
  },
  {
    species: SpeciesId.DUSTOX,
    formIndex: 0,
  },
  {
    species: SpeciesId.SWELLOW,
    formIndex: 0,
  },
  {
    species: SpeciesId.PELIPPER,
    formIndex: 0,
  },
  {
    species: SpeciesId.MASQUERAIN,
    formIndex: 0,
  },
  {
    species: SpeciesId.VIBRAVA,
    formIndex: 0,
  },
  {
    species: SpeciesId.ALTARIA,
    formIndex: 0,
  },
  {
    species: SpeciesId.LUNATONE,
    formIndex: 0,
  },
  {
    species: SpeciesId.SOLROCK,
    formIndex: 0,
  },
  {
    species: SpeciesId.CLAYDOL,
    formIndex: 0,
  },
  {
    species: SpeciesId.TROPIUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.CHIMECHO,
    formIndex: 0,
  },
  {
    species: SpeciesId.GLALIE,
    formIndex: 0,
  },
  {
    species: SpeciesId.METANG,
    formIndex: 0,
  },
  {
    species: SpeciesId.STARAVIA,
    formIndex: 0,
  },
  {
    species: SpeciesId.STARAPTOR,
    formIndex: 0,
  },
  {
    species: SpeciesId.MOTHIM,
    formIndex: 0,
  },
  {
    species: SpeciesId.VESPIQUEN,
    formIndex: 0,
  },
  {
    species: SpeciesId.DRIFBLIM,
    formIndex: 0,
  },
  {
    species: SpeciesId.MISMAGIUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.HONCHKROW,
    formIndex: 0,
  },
  {
    species: SpeciesId.BRONZONG,
    formIndex: 0,
  },
  {
    species: SpeciesId.CARNIVINE,
    formIndex: 0,
  },
  {
    species: SpeciesId.MAGNEZONE,
    formIndex: 0,
  },
  {
    species: SpeciesId.TOGEKISS,
    formIndex: 0,
  },
  {
    species: SpeciesId.YANMEGA,
    formIndex: 0,
  },
  {
    species: SpeciesId.GLISCOR,
    formIndex: 0,
  },
  {
    species: SpeciesId.PORYGON_Z,
    formIndex: 0,
  },
  {
    species: SpeciesId.PROBOPASS,
    formIndex: 0,
  },
  {
    species: SpeciesId.DUSKNOIR,
    formIndex: 0,
  },
  {
    species: SpeciesId.FROSLASS,
    formIndex: 0,
  },
  {
    species: SpeciesId.ROTOM, // allow all forms
    formIndex: 0, // normal
  },
  {
    species: SpeciesId.ROTOM,
    formIndex: 1, // heat
  },
  {
    species: SpeciesId.ROTOM,
    formIndex: 2, // wash
  },
  {
    species: SpeciesId.ROTOM,
    formIndex: 3, // frost
  },
  {
    species: SpeciesId.ROTOM,
    formIndex: 4, // fan
  },
  {
    species: SpeciesId.ROTOM,
    formIndex: 5, // mow
  },
  {
    species: SpeciesId.TRANQUILL,
    formIndex: 0,
  },
  {
    species: SpeciesId.UNFEZANT,
    formIndex: 0,
  },
  {
    species: SpeciesId.SWOOBAT,
    formIndex: 0,
  },
  {
    species: SpeciesId.SIGILYPH,
    formIndex: 0,
  },
  {
    species: SpeciesId.ARCHEOPS,
    formIndex: 0,
  },
  {
    species: SpeciesId.DUOSION,
    formIndex: 0,
  },
  {
    species: SpeciesId.REUNICLUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.SWANNA,
    formIndex: 0,
  },
  {
    species: SpeciesId.VANILLISH,
    formIndex: 0,
  },
  {
    species: SpeciesId.VANILLUXE,
    formIndex: 0,
  },
  {
    species: SpeciesId.KLANG,
    formIndex: 0,
  },
  {
    species: SpeciesId.KLINKLANG,
    formIndex: 0,
  },
  {
    species: SpeciesId.EELEKTRIK,
    formIndex: 0,
  },
  {
    species: SpeciesId.EELEKTROSS,
    formIndex: 0,
  },
  {
    species: SpeciesId.BEHEEYEM,
    formIndex: 0,
  },
  {
    species: SpeciesId.LAMPENT,
    formIndex: 0,
  },
  {
    species: SpeciesId.CHANDELURE,
    formIndex: 0,
  },
  {
    species: SpeciesId.CRYOGONAL,
    formIndex: 0,
  },
  {
    species: SpeciesId.BRAVIARY,
    formIndex: 0,
  },
  {
    species: SpeciesId.MANDIBUZZ,
    formIndex: 0,
  },
  {
    species: SpeciesId.MELOETTA,
    formIndex: 0,
  }, // Aria
  {
    species: SpeciesId.FLETCHINDER,
    formIndex: 0,
  },
  {
    species: SpeciesId.TALONFLAME,
    formIndex: 0,
  },
  {
    species: SpeciesId.VIVILLON,
    formIndex: 0,
  },
  {
    species: SpeciesId.HAWLUCHA,
    formIndex: 0,
  },
  {
    species: SpeciesId.DARTRIX,
    formIndex: 0,
  },
  {
    species: SpeciesId.TRUMBEAK,
    formIndex: 0,
  },
  {
    species: SpeciesId.TOUCANNON,
    formIndex: 0,
  },
  {
    species: SpeciesId.VIKAVOLT,
    formIndex: 0,
  },
  {
    species: SpeciesId.ORICORIO, // ALL (Baile, Pompom, Pau, Sensu)
    formIndex: 0, // Baile
  },
  {
    species: SpeciesId.ORICORIO,
    formIndex: 1, // Pompom
  },
  {
    species: SpeciesId.ORICORIO,
    formIndex: 2, // Pau
  },
  {
    species: SpeciesId.ORICORIO,
    formIndex: 3, // Sensu
  },
  {
    species: SpeciesId.RIBOMBEE,
    formIndex: 0,
  },
  {
    species: SpeciesId.COSMOEM,
    formIndex: 0,
  },
  {
    species: SpeciesId.CORVISQUIRE,
    formIndex: 0,
  },
  {
    species: SpeciesId.CORVIKNIGHT,
    formIndex: 0,
  },
  {
    species: SpeciesId.ORBEETLE,
    formIndex: 0,
  },
  {
    species: SpeciesId.FLAPPLE,
    formIndex: 0,
  },
  {
    species: SpeciesId.CRAMORANT,
    formIndex: 0,
  },
  {
    species: SpeciesId.POLTEAGEIST,
    formIndex: 0,
  },
  {
    species: SpeciesId.FROSMOTH,
    formIndex: 0,
  },
  {
    species: SpeciesId.DRAKLOAK,
    formIndex: 0,
  },
  {
    species: SpeciesId.RABSCA,
    formIndex: 0,
  },
  {
    species: SpeciesId.BOMBIRDIER,
    formIndex: 0,
  },
  {
    species: SpeciesId.REVAVROOM,
    formIndex: 0,
  },
  {
    species: SpeciesId.FLAMIGO,
    formIndex: 0,
  },
  {
    species: SpeciesId.SINISTCHA,
    formIndex: 0,
  },
];

const STRONG_TIER: { species: SpeciesId; formIndex?: number }[] = [
  {
    species: SpeciesId.CHARIZARD,
    formIndex: 0,
  },
  {
    species: SpeciesId.CHARIZARD,
    formIndex: 1,
  },
  {
    species: SpeciesId.CHARIZARD,
    formIndex: 2,
  },
  {
    species: SpeciesId.BUTTERFREE,
    formIndex: 1,
  },
  {
    species: SpeciesId.PIDGEOT,
    formIndex: 1,
  },
  {
    species: SpeciesId.ALAKAZAM,
    formIndex: 1,
  },
  {
    species: SpeciesId.GENGAR,
    formIndex: 0,
  },
  {
    species: SpeciesId.GYARADOS,
    formIndex: 0,
  },
  {
    species: SpeciesId.GYARADOS,
    formIndex: 1,
  },
  {
    species: SpeciesId.AERODACTYL,
    formIndex: 0,
  },
  {
    species: SpeciesId.AERODACTYL,
    formIndex: 1,
  },
  {
    species: SpeciesId.ARTICUNO,
  },
  {
    species: SpeciesId.ZAPDOS,
  },
  {
    species: SpeciesId.MOLTRES,
  },
  {
    species: SpeciesId.DRAGONITE,
  },
  {
    species: SpeciesId.MEWTWO,
    formIndex: 0,
  },
  {
    species: SpeciesId.MEWTWO,
    formIndex: 1,
  },
  {
    species: SpeciesId.MEWTWO,
    formIndex: 2,
  },
  {
    species: SpeciesId.MEW,
  },
  {
    species: SpeciesId.LUGIA,
  },
  {
    species: SpeciesId.HO_OH,
  },
  {
    species: SpeciesId.CELEBI,
  },
  {
    species: SpeciesId.FLYGON,
  },
  {
    species: SpeciesId.ALTARIA,
    formIndex: 1,
  },
  {
    species: SpeciesId.GLALIE,
    formIndex: 1,
  },
  {
    species: SpeciesId.SALAMENCE,
    formIndex: 0,
  },
  {
    species: SpeciesId.SALAMENCE,
    formIndex: 1,
  },
  {
    species: SpeciesId.METAGROSS,
    formIndex: 1,
  },
  {
    species: SpeciesId.LATIAS,
    formIndex: 0,
  },
  {
    species: SpeciesId.LATIAS,
    formIndex: 1,
  },
  {
    species: SpeciesId.LATIOS,
    formIndex: 0,
  },
  {
    species: SpeciesId.LATIOS,
    formIndex: 1,
  },
  {
    species: SpeciesId.RAYQUAZA,
    formIndex: 0,
  },
  {
    species: SpeciesId.RAYQUAZA,
    formIndex: 1,
  },
  {
    species: SpeciesId.JIRACHI,
  },
  {
    species: SpeciesId.DEOXYS,
    formIndex: 0,
  },
  {
    species: SpeciesId.DEOXYS,
    formIndex: 1,
  },
  {
    species: SpeciesId.DEOXYS,
    formIndex: 2,
  },
  {
    species: SpeciesId.DEOXYS,
    formIndex: 3,
  },
  {
    species: SpeciesId.UXIE,
  },
  {
    species: SpeciesId.MESPRIT,
  },
  {
    species: SpeciesId.AZELF,
  },
  {
    species: SpeciesId.DIALGA,
    formIndex: 0,
  },
  {
    species: SpeciesId.DIALGA,
    formIndex: 1,
  },
  {
    species: SpeciesId.PALKIA,
    formIndex: 0,
  },
  {
    species: SpeciesId.PALKIA,
    formIndex: 1,
  },
  {
    species: SpeciesId.GIRATINA,
    formIndex: 0,
  },
  {
    species: SpeciesId.GIRATINA,
    formIndex: 1,
  },
  {
    species: SpeciesId.CRESSELIA,
  },
  {
    species: SpeciesId.DARKRAI,
  },
  {
    species: SpeciesId.SHAYMIN,
    formIndex: 1,
  },
  {
    species: SpeciesId.ARCEUS,
  },
  {
    species: SpeciesId.HYDREIGON,
  },
  {
    species: SpeciesId.VOLCARONA,
  },
  {
    species: SpeciesId.TORNADUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.TORNADUS,
    formIndex: 1,
  },
  {
    species: SpeciesId.THUNDURUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.THUNDURUS,
    formIndex: 1,
  },
  {
    species: SpeciesId.RESHIRAM,
  },
  {
    species: SpeciesId.ZEKROM,
  },
  {
    species: SpeciesId.KYUREM,
    formIndex: 1,
  },
  {
    species: SpeciesId.KYUREM,
    formIndex: 2,
  },
  {
    species: SpeciesId.LANDORUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.LANDORUS,
    formIndex: 1,
  },
  {
    species: SpeciesId.NOIVERN,
  },
  {
    species: SpeciesId.YVELTAL,
  },
  {
    species: SpeciesId.HOOPA,
    formIndex: 0,
  },
  {
    species: SpeciesId.HOOPA,
    formIndex: 1,
  },
  {
    species: SpeciesId.TAPU_KOKO,
  },
  {
    species: SpeciesId.TAPU_LELE,
  },
  {
    species: SpeciesId.TAPU_BULU,
  },
  {
    species: SpeciesId.TAPU_FINI,
  },
  {
    species: SpeciesId.SOLGALEO,
  },
  {
    species: SpeciesId.LUNALA,
  },
  {
    species: SpeciesId.NIHILEGO,
  },
  {
    species: SpeciesId.BUZZWOLE,
  },
  {
    species: SpeciesId.CELESTEELA,
  },
  {
    species: SpeciesId.KARTANA,
  },
  {
    species: SpeciesId.NECROZMA,
    formIndex: 0,
  },
  {
    species: SpeciesId.NECROZMA,
    formIndex: 1,
  },
  {
    species: SpeciesId.NECROZMA,
    formIndex: 2,
  },
  {
    species: SpeciesId.NECROZMA,
    formIndex: 3,
  },
  {
    species: SpeciesId.NAGANADEL,
  },
  {
    species: SpeciesId.CORVIKNIGHT,
    formIndex: 1,
  },
  {
    species: SpeciesId.ORBEETLE,
    formIndex: 1,
  },
  {
    species: SpeciesId.DRAGAPULT,
  },
  {
    species: SpeciesId.ETERNATUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.ETERNATUS,
    formIndex: 1,
  },
  {
    species: SpeciesId.REGIELEKI,
  },
  {
    species: SpeciesId.REGIDRAGO,
  },
  {
    species: SpeciesId.CALYREX,
    formIndex: 0,
  },
  {
    species: SpeciesId.ENAMORUS,
    formIndex: 0,
  },
  {
    species: SpeciesId.ENAMORUS,
    formIndex: 1,
  },
  {
    species: SpeciesId.KILOWATTREL,
  },
  {
    species: SpeciesId.GLIMMORA,
  },
  {
    species: SpeciesId.SCREAM_TAIL,
  },
  {
    species: SpeciesId.FLUTTER_MANE,
  },
  {
    species: SpeciesId.IRON_JUGULIS,
  },
  {
    species: SpeciesId.IRON_MOTH,
  },
  {
    species: SpeciesId.CHI_YU,
  },
  {
    species: SpeciesId.ROARING_MOON,
  },
  {
    species: SpeciesId.MIRAIDON,
  },
  {
    species: SpeciesId.FEZANDIPITI,
  },
  {
    species: SpeciesId.PECHARUNT,
  },
  {
    species: SpeciesId.ALOLA_RAICHU,
  },
  {
    species: SpeciesId.GALAR_WEEZING,
  },
  {
    species: SpeciesId.GALAR_ARTICUNO,
  },
  {
    species: SpeciesId.GALAR_MOLTRES,
  },
  {
    species: SpeciesId.HISUI_BRAVIARY,
  },
];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.FLY,
  MoveId.BRAVE_BIRD,
  MoveId.ACROBATICS,
  MoveId.DRAGON_ASCENT,
  MoveId.BEAK_BLAST,
  MoveId.FLOATY_FALL,
  MoveId.DUAL_WINGBEAT,
];

const SPECIAL_TUTOR_MOVES = [MoveId.AEROBLAST, MoveId.AIR_SLASH, MoveId.HURRICANE, MoveId.BLEAKWIND_STORM];

const SUPPORT_TUTOR_MOVES = [MoveId.FEATHER_DANCE, MoveId.ROOST, MoveId.PLUCK, MoveId.TAILWIND];

const INELIGIBLE_MOVES: MoveId[] = [
  MoveId.BODY_SLAM,
  MoveId.BULLDOZE,
  MoveId.DIG,
  MoveId.SAND_ATTACK, // extra move left here to test code with pidgey (with no need for overrides)
  MoveId.DIVE,
  MoveId.EARTH_POWER,
  MoveId.EARTHQUAKE,
  MoveId.ELECTRIC_TERRAIN,
  MoveId.FIRE_PLEDGE,
  MoveId.FISSURE,
  MoveId.FLYING_PRESS,
  MoveId.FRENZY_PLANT,
  MoveId.GEOMANCY,
  MoveId.GRASS_KNOT,
  MoveId.GRASS_PLEDGE,
  MoveId.GRASSY_TERRAIN,
  MoveId.GRAVITY,
  MoveId.HEAVY_SLAM,
  MoveId.INGRAIN,
  MoveId.LANDS_WRATH,
  MoveId.MAGNITUDE,
  MoveId.MAT_BLOCK,
  MoveId.MISTY_TERRAIN,
  MoveId.MUD_SPORT,
  MoveId.MUDDY_WATER,
  MoveId.ROTOTILLER,
  MoveId.SEISMIC_TOSS,
  MoveId.SLAM,
  MoveId.SMACK_DOWN,
  MoveId.SPIKES,
  MoveId.STOMP,
  MoveId.SUBSTITUTE,
  MoveId.SURF,
  MoveId.TOXIC_SPIKES,
  MoveId.WATER_PLEDGE,
  MoveId.WATER_SPORT,
];

const sky_battle_requirements = new AnyCombinationPokemonRequirement(
  3,
  new TypeRequirement(PokemonType.FLYING, false, 1),
  new AbilityRequirement(AbilityId.LEVITATE, false, 1),
  new SpeciesRequirement(POOL_ALL_FORMS, 1, false),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_BASEFORM, 1, false),
    CombinationPokemonRequirement.Some(
      new FormPokemonRequirement("", 1),
      new FormPokemonRequirement(SpeciesFormKey.NORMAL, 1),
    ),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_MEGA, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.MEGA, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_MEGA_X, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.MEGA_X, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_MEGA_Y, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.MEGA_Y, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_SKY, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.SKY, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_BLACK, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.BLACK, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_WHITE, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.WHITE, 1),
  ),
  CombinationPokemonRequirement.Every(
    new SpeciesRequirement(POOL_ARIA, 1, false),
    new FormPokemonRequirement(SpeciesFormKey.ARIA, 1),
  ),
);

const WAVE_LEVEL_BREAKPOINTS = [80, 150];

// Helpful variables
let female = false;

/**
 * Sky Battle encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/5487 | GitHub Issue #5487}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SkyBattleEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.SKY_BATTLE,
)
  .withPrimaryPokemonRequirement(sky_battle_requirements)
  .withMaxAllowedEncounters(1)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(...SKY_BATTLE_WAVES)
  .withIntroSpriteConfigs([]) // Sprite is set in onInit()
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:intro_dialogue`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const partySize: number = sky_battle_requirements.queryParty(globalScene.getPlayerParty()).length;

    // randomize trainer gender
    female = !!randSeedInt(2);
    const config = getTrainerConfig(partySize, globalScene.currentBattle.waveIndex);
    const spriteKey = config.getSpriteKey(female);
    encounter.enemyPartyConfigs.push({
      trainerConfig: config,
      female: female,
    });

    // loads trainer sprite at start of encounter
    encounter.spriteConfigs = [
      {
        spriteKey: spriteKey,
        fileRoot: "trainer",
        hasShadow: false,
        x: 4,
        y: 7,
      },
    ];

    const intro = [
      {
        text: female ? `${namespace}:intro_f` : `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: female ? `${namespace}:intro_dialogue_f` : `${namespace}:intro_dialogue`,
      },
    ];
    const title = `${namespace}:title`;
    const description = female ? `${namespace}:description_f` : `${namespace}:description`;
    const outro = [
      {
        text: female ? `${namespace}:outro_f` : `${namespace}:outro`,
      },
    ];

    encounter.dialogue = { ...encounter.dialogue, intro: intro };
    let encounterOptionsDialogue = encounter.dialogue.encounterOptionsDialogue ?? {};
    encounter.dialogue = {
      ...encounter.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        title,
      },
    };
    encounterOptionsDialogue = encounter.dialogue.encounterOptionsDialogue ?? {};
    encounter.dialogue = {
      ...encounter.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        description,
      },
    };
    encounter.dialogue = { ...encounter.dialogue, outro: outro };

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    //Option 1: Battle
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: female ? `${namespace}:option.1.selected_f` : `${namespace}:option.1.selected`,
        },
      ],
    },
    async () => {
      // TODO: Update selected text based on female

      // Select sky battle
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

      // Init the moves available for tutor
      const moveTutorOptions: PokemonMove[] = [];
      moveTutorOptions.push(
        new PokemonMove(PHYSICAL_TUTOR_MOVES[randSeedInt(PHYSICAL_TUTOR_MOVES.length)]),
        new PokemonMove(SPECIAL_TUTOR_MOVES[randSeedInt(SPECIAL_TUTOR_MOVES.length)]),
        new PokemonMove(SUPPORT_TUTOR_MOVES[randSeedInt(SUPPORT_TUTOR_MOVES.length)]),
      );

      encounter.misc = {
        moveTutorOptions,
      };

      //Ordering here is relevant
      disableDisallowedPokemon();
      disableIllegalMoves();

      // Assigns callback that teaches move before continuing to rewards
      encounter.onRewards = doFlyingTypeTutor;

      setEncounterRewards({ fillRemaining: true });
      encounter.spriteConfigs[0].hasShadow = false; //TODO: Is this [0] correct enough?
      await transitionMysteryEncounterIntroVisuals(true, true);
      await initBattleWithEnemyConfig(config);

      disableEnemyIllegalMoves();
    },
  )
  .withOption(
    //Option 2: Flaunt flying pokemon
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(sky_battle_requirements) // Must pass the same requirements to trigger this encounter
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabled_tooltip`,
      })
      .withPreOptionPhase(async () => {
        // Player shows off their Flying pokemon
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        setEncounterRewards({
          guaranteedModifierTypeFuncs: [modifierTypes.QUICK_CLAW, modifierTypes.MAX_LURE, modifierTypes.ULTRA_BALL],
          fillRemaining: false,
        });
        encounter.selectedOption!.dialogue!.selected = [
          {
            speaker: `${namespace}:speaker`,
            text: female ? `${namespace}:option.2.selected_f` : `${namespace}:option.2.selected`,
          },
        ];
      })
      .withOptionPhase(async () => {
        // Player shows off their Flying pokémon
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withSimpleOption(
    //Option 3: Reject battle and leave with no rewards
    {
      buttonLabel: `${namespace}:option.3.label`,
      buttonTooltip: `${namespace}:option.3.tooltip`,
      selected: [
        {
          text: female ? `${namespace}:option.3.selected_f` : `${namespace}:option.3.selected`,
        },
      ],
    },
    async () => {
      leaveEncounterWithoutBattle();
      return true;
    },
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();

function getTrainerConfig(party_size: number, wave_index: number): TrainerConfig {
  // Sky trainer config
  const config = trainerConfigs[TrainerType.SKY_TRAINER].clone();
  config.name = i18next.t("trainerNames:sky_trainer");

  // choose pool according to wave
  let trainer_pool: any;
  if (wave_index < WAVE_LEVEL_BREAKPOINTS[0]) {
    trainer_pool = WEAK_TIER.slice(0);
  } else if (wave_index < WAVE_LEVEL_BREAKPOINTS[1]) {
    trainer_pool = MID_TIER.slice(0);
  } else {
    trainer_pool = STRONG_TIER.slice(0);
  }

  trainer_pool = randSeedShuffle(trainer_pool);

  config.setPartyTemplates(new TrainerPartyTemplate(party_size, PartyMemberStrength.STRONG));

  // adds a non-repeating random pokemon
  for (let index = 0; index < party_size; index++) {
    const rand_pokemon = trainer_pool.pop()!;
    const rand_species = isNullOrUndefined(rand_pokemon.species) ? rand_pokemon : rand_pokemon.species;
    config.setPartyMemberFunc(
      index,
      getRandomPartyMemberFunc([rand_species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(rand_pokemon.formIndex)) {
          p.formIndex = rand_pokemon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }),
    );
  }

  return config;
}

function doFlyingTypeTutor(): Promise<void> {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO explain
  return new Promise<void>(async resolve => {
    const moveOptions = globalScene.currentBattle.mysteryEncounter!.misc.moveTutorOptions;

    //Ordering here is relevant
    reEnableIllegalMoves();
    reEnableDisallowedPokemon();

    await showEncounterDialogue(
      female ? `${namespace}:battle_won_f` : `${namespace}:battle_won`,
      `${namespace}:speaker`,
    );

    const overlayScale = 1;
    const moveInfoOverlay = new MoveInfoOverlay({
      delayVisibility: false,
      scale: overlayScale,
      onSide: true,
      right: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale, true) - 1,
      width: globalScene.game.canvas.width / 6 - 2,
    });
    globalScene.ui.add(moveInfoOverlay);

    const optionSelectItems = moveOptions.map((move: PokemonMove) => {
      const option: OptionSelectItem = {
        label: move.getName(),
        handler: () => {
          moveInfoOverlay.active = false;
          moveInfoOverlay.setVisible(false);
          return true;
        },
        onHover: () => {
          moveInfoOverlay.active = true;
          moveInfoOverlay.show(allMoves[move.moveId]);
        },
      };
      return option;
    });

    const onHoverOverCancel = () => {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    };

    const result = await selectOptionThenPokemon(
      optionSelectItems,
      `${namespace}:teach_move_prompt`,
      undefined, // No filter
      onHoverOverCancel,
    );
    if (!result) {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    }
    // Option select complete, handle if they are learning a move
    if (result && result.selectedOptionIndex < moveOptions.length) {
      globalScene.phaseManager.unshiftPhase(
        new LearnMovePhase(result.selectedPokemonIndex, moveOptions[result.selectedOptionIndex].moveId),
      );
    }

    // Complete battle and go to rewards
    resolve();
  });
}

const disallowedPokemon: Map<number, PlayerPokemon> = new Map<number, PlayerPokemon>();
function disableDisallowedPokemon(): void {
  disallowedPokemon.clear();
  const allowedPokemon = sky_battle_requirements.queryParty(globalScene.getPlayerParty());
  globalScene.getPlayerParty().filter(pokemon => !allowedPokemon.includes(pokemon));
  globalScene.getPlayerParty().forEach((pokemon, index) => {
    if (!allowedPokemon.includes(pokemon)) {
      disallowedPokemon.set(index, pokemon);
    }
  });

  disallowedPokemon.forEach(pokemon => globalScene.removePokemonFromPlayerParty(pokemon, false));
}

function reEnableDisallowedPokemon(): void {
  disallowedPokemon.forEach((pokemon, index) => {
    globalScene.getPlayerParty().splice(index, 0, pokemon);
  });
}

let originalMovesets: PokemonMove[][] = [];
function disableIllegalMoves(): void {
  originalMovesets = [];
  globalScene.getPlayerParty().forEach(pokemon => {
    originalMovesets.push(pokemon.moveset.slice(0));
    pokemon.moveset = pokemon.moveset.filter(move => !INELIGIBLE_MOVES.includes(move.getMove().id));
  });
}

function reEnableIllegalMoves(): void {
  originalMovesets.forEach((moveset, idx) => {
    globalScene.getPlayerParty()[idx].moveset = moveset;
  });
}

function disableEnemyIllegalMoves(): void {
  globalScene.getEnemyParty().forEach(pokemon =>
    pokemon.moveset
      .filter(move => INELIGIBLE_MOVES.includes(move.getMove().id))
      .forEach(move => {
        move.ppUsed = move.getMovePp();
      }),
  );
}
