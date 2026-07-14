/**
 * Contains a map of species to the offensive move category they should not
 * generate moves for
 *
 * Part of moveset generation to avoid egregious cases like mega beedrill
 * generating special moves despite having 15 SpA.
 * @module
 */

import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";

// Written as constants here to allow them to be inlined by bundler
const DENY_SPECIAL_MOVES = 1;
const DENY_PHYSICAL_MOVES = 0;

/**
 * A map of species to the offensive stat category that they should *not* generate with.
 *
 * @remarks
 * If a species is on this list, moves of the specified category will be
 * filtered out for it. Putting a species here will block moves of
 * the category for all forms. To only block for a specific form, instead use a
 * nested object with each form index as the key (see Calyrex for an example).
 *
 * Note that this will not block body press.
 *
 * @privateRemarks
 * The philosophy behind this list is that it should be used sparingly.
 * The point is to mostly to block egregious offenders, like mega beedrill.
 * Discussions with balance team caused creep in this list.
 *
 * Generally, any mon with <=40 in the off stat should be on this list
 */
const WORSE_OFFENSIVE_STAT_SPECIES_DENYLIST: Readonly<Partial<Record<SpeciesId, 0 | 1 | Record<number, 0 | 1>>>> = {
  //#region physical deny list
  [SpeciesId.ALAKAZAM]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ALOLA_RAICHU]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ARMAROUGE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.BELLIBOLT]: DENY_PHYSICAL_MOVES,
  [SpeciesId.BUTTERFREE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.CHANDELURE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.DELPHOX]: DENY_PHYSICAL_MOVES,
  [SpeciesId.DRAMPA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.EMPOLEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ESPATHRA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ESPEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.FLORGES]: DENY_PHYSICAL_MOVES,
  [SpeciesId.FROSMOTH]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GENGAR]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GHOLDENGO]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GLACEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GLIMMORA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GRUMPIG]: DENY_PHYSICAL_MOVES,
  [SpeciesId.HISUI_BRAVIARY]: DENY_PHYSICAL_MOVES,
  [SpeciesId.HYDRAPPLE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.HYDREIGON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.INDEEDEE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.INTELEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.JOLTEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.JYNX]: DENY_PHYSICAL_MOVES,
  [SpeciesId.LILLIGANT]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MAGNEZONE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MANTINE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MASQUERAIN]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MILOTIC]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MR_MIME]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MUSHARNA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.POLTEAGEIST]: DENY_PHYSICAL_MOVES,
  [SpeciesId.PRIMARINA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.RABSCA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.REUNICLUS]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ROSERADE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SALAZZLE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SHIINOTIC]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SINISTCHA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SKELEDIRGE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SYLVEON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.TATSUGIRI]: DENY_PHYSICAL_MOVES,
  [SpeciesId.TOGEKISS]: DENY_PHYSICAL_MOVES,
  [SpeciesId.VIKAVOLT]: DENY_PHYSICAL_MOVES,
  [SpeciesId.VOLCARONA]: DENY_PHYSICAL_MOVES,

  // legendaries by dex order since there's few enough
  [SpeciesId.ARTICUNO]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MOLTRES]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ZAPDOS]: DENY_PHYSICAL_MOVES,
  [SpeciesId.LUGIA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.REGICE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.KELDEO]: DENY_PHYSICAL_MOVES,
  [SpeciesId.TAPU_LELE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.LUNALA]: DENY_PHYSICAL_MOVES,
  [SpeciesId.NIHILEGO]: DENY_PHYSICAL_MOVES,
  [SpeciesId.XURKITREE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.SPECTRIER]: DENY_PHYSICAL_MOVES,
  [SpeciesId.FLUTTER_MANE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.IRON_JUGULIS]: DENY_PHYSICAL_MOVES,
  [SpeciesId.IRON_MOTH]: DENY_PHYSICAL_MOVES,
  [SpeciesId.MIRAIDON]: DENY_PHYSICAL_MOVES,
  [SpeciesId.TERAPAGOS]: DENY_PHYSICAL_MOVES,
  [SpeciesId.ETERNAL_FLOETTE]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GALAR_ARTICUNO]: DENY_PHYSICAL_MOVES,
  [SpeciesId.GALAR_MOLTRES]: DENY_PHYSICAL_MOVES,
  [SpeciesId.BLOODMOON_URSALUNA]: DENY_PHYSICAL_MOVES,

  // Megas in dex order
  [SpeciesId.VENUSAUR]: { 1: DENY_PHYSICAL_MOVES }, // Mega Venusaur
  [SpeciesId.BLASTOISE]: { 1: DENY_PHYSICAL_MOVES }, // Mega Blastoise
  [SpeciesId.PIDGEOT]: { 1: DENY_PHYSICAL_MOVES }, // Mega Pidgeot
  [SpeciesId.CLEFABLE]: { 1: DENY_PHYSICAL_MOVES }, // Mega Clefable
  [SpeciesId.SLOWBRO]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.LAPRAS]: { 1: DENY_PHYSICAL_MOVES }, // G-Max Lapras
  [SpeciesId.DRAGONITE]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.AMPHAROS]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.HOUNDOOM]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.GARDEVOIR]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.MANECTRIC]: { 1: DENY_PHYSICAL_MOVES },
  [SpeciesId.CAMERUPT]: { 1: DENY_PHYSICAL_MOVES }, // Because sheer force physical moves bad
  [SpeciesId.LUCARIO]: { 2: DENY_PHYSICAL_MOVES }, // Mega Z
  //#endregion physical deny list

  //#region special deny list
  [SpeciesId.AGGRON]: DENY_SPECIAL_MOVES,
  [SpeciesId.ALOLA_DUGTRIO]: DENY_SPECIAL_MOVES,
  [SpeciesId.ALOLA_GOLEM]: DENY_SPECIAL_MOVES,
  [SpeciesId.ALOLA_MUK]: DENY_SPECIAL_MOVES,
  [SpeciesId.ALOLA_SANDSLASH]: DENY_SPECIAL_MOVES,
  [SpeciesId.ANNIHILAPE]: DENY_SPECIAL_MOVES,
  [SpeciesId.AVALUGG]: DENY_SPECIAL_MOVES,
  [SpeciesId.BARRASKEWDA]: DENY_SPECIAL_MOVES,
  [SpeciesId.BAXCALIBUR]: DENY_SPECIAL_MOVES,
  [SpeciesId.BEEDRILL]: DENY_SPECIAL_MOVES,
  [SpeciesId.BEWEAR]: DENY_SPECIAL_MOVES,
  [SpeciesId.BOUFFALANT]: DENY_SPECIAL_MOVES,
  [SpeciesId.BRAVIARY]: DENY_SPECIAL_MOVES,
  [SpeciesId.BRELOOM]: DENY_SPECIAL_MOVES,
  [SpeciesId.CERULEDGE]: DENY_SPECIAL_MOVES,
  [SpeciesId.CETITAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.CHESNAUGHT]: DENY_SPECIAL_MOVES,
  [SpeciesId.CONKELDURR]: DENY_SPECIAL_MOVES,
  [SpeciesId.CRABOMINABLE]: DENY_SPECIAL_MOVES,
  [SpeciesId.DARMANITAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.DODRIO]: DENY_SPECIAL_MOVES,
  [SpeciesId.DONPHAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.DRAPION]: DENY_SPECIAL_MOVES,
  [SpeciesId.DREDNAW]: DENY_SPECIAL_MOVES,
  [SpeciesId.DRUDDIGON]: DENY_SPECIAL_MOVES,
  [SpeciesId.DUGTRIO]: DENY_SPECIAL_MOVES,
  [SpeciesId.DURANT]: DENY_SPECIAL_MOVES,
  [SpeciesId.DUSKNOIR]: DENY_SPECIAL_MOVES,
  [SpeciesId.ESCAVALIER]: DENY_SPECIAL_MOVES,
  [SpeciesId.EXCADRILL]: DENY_SPECIAL_MOVES,
  [SpeciesId.GALAR_DARMANITAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.GALLADE]: DENY_SPECIAL_MOVES,
  [SpeciesId.GARGANACL]: DENY_SPECIAL_MOVES,
  [SpeciesId.GIGALITH]: DENY_SPECIAL_MOVES,
  [SpeciesId.GLISCOR]: DENY_SPECIAL_MOVES,
  [SpeciesId.GOLEM]: DENY_SPECIAL_MOVES,
  [SpeciesId.GOLISOPOD]: DENY_SPECIAL_MOVES,
  [SpeciesId.GOLURK]: DENY_SPECIAL_MOVES,
  [SpeciesId.GRANBULL]: DENY_SPECIAL_MOVES,
  [SpeciesId.GUMSHOOS]: DENY_SPECIAL_MOVES,
  [SpeciesId.HARIYAMA]: DENY_SPECIAL_MOVES,
  [SpeciesId.HAXORUS]: DENY_SPECIAL_MOVES,
  [SpeciesId.HERACROSS]: DENY_SPECIAL_MOVES,
  [SpeciesId.HISUI_AVALUGG]: DENY_SPECIAL_MOVES,
  [SpeciesId.HISUI_LILLIGANT]: DENY_SPECIAL_MOVES,
  [SpeciesId.HITMONCHAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.HITMONLEE]: DENY_SPECIAL_MOVES,
  [SpeciesId.HITMONTOP]: DENY_SPECIAL_MOVES,
  [SpeciesId.HOUNDSTONE]: DENY_SPECIAL_MOVES,
  [SpeciesId.INCINEROAR]: DENY_SPECIAL_MOVES,
  [SpeciesId.KANGASKHAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.KINGAMBIT]: DENY_SPECIAL_MOVES,
  [SpeciesId.KINGLER]: DENY_SPECIAL_MOVES,
  [SpeciesId.KLAWF]: DENY_SPECIAL_MOVES,
  [SpeciesId.KLEAVOR]: DENY_SPECIAL_MOVES,
  [SpeciesId.KROOKODILE]: DENY_SPECIAL_MOVES,
  [SpeciesId.LYCANROC]: DENY_SPECIAL_MOVES,
  [SpeciesId.MABOSSTIFF]: DENY_SPECIAL_MOVES,
  [SpeciesId.MACHAMP]: DENY_SPECIAL_MOVES,
  [SpeciesId.MEDICHAM]: DENY_SPECIAL_MOVES,
  [SpeciesId.MEOWSCARADA]: DENY_SPECIAL_MOVES,
  [SpeciesId.MILTANK]: DENY_SPECIAL_MOVES,
  [SpeciesId.MUDSDALE]: DENY_SPECIAL_MOVES,
  [SpeciesId.MUK]: DENY_SPECIAL_MOVES,
  [SpeciesId.PALDEA_TAUROS]: DENY_SPECIAL_MOVES,
  [SpeciesId.PASSIMIAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.PERRSERKER]: DENY_SPECIAL_MOVES,
  [SpeciesId.PINSIR]: DENY_SPECIAL_MOVES,
  [SpeciesId.QUAQUAVAL]: DENY_SPECIAL_MOVES,
  [SpeciesId.RAMPARDOS]: DENY_SPECIAL_MOVES,
  [SpeciesId.RELICANTH]: DENY_SPECIAL_MOVES,
  [SpeciesId.REVAVROOM]: DENY_SPECIAL_MOVES,
  [SpeciesId.RHYPERIOR]: DENY_SPECIAL_MOVES,
  [SpeciesId.RILLABOOM]: DENY_SPECIAL_MOVES,
  [SpeciesId.SANDSLASH]: DENY_SPECIAL_MOVES,
  [SpeciesId.SAWK]: DENY_SPECIAL_MOVES,
  [SpeciesId.SCIZOR]: DENY_SPECIAL_MOVES,
  [SpeciesId.SCOLIPEDE]: DENY_SPECIAL_MOVES,
  [SpeciesId.SCRAFTY]: DENY_SPECIAL_MOVES,
  [SpeciesId.SCYTHER]: DENY_SPECIAL_MOVES,
  [SpeciesId.SHEDINJA]: DENY_SPECIAL_MOVES,
  [SpeciesId.SKARMORY]: DENY_SPECIAL_MOVES,
  [SpeciesId.SIRFETCHD]: DENY_SPECIAL_MOVES,
  [SpeciesId.SNEASLER]: DENY_SPECIAL_MOVES,
  [SpeciesId.SNORLAX]: DENY_SPECIAL_MOVES,
  [SpeciesId.STARAPTOR]: DENY_SPECIAL_MOVES,
  [SpeciesId.STEELIX]: DENY_SPECIAL_MOVES,
  [SpeciesId.STONJOURNER]: DENY_SPECIAL_MOVES,
  [SpeciesId.STOUTLAND]: DENY_SPECIAL_MOVES,
  [SpeciesId.SQUAWKABILLY]: DENY_SPECIAL_MOVES,
  [SpeciesId.SUDOWOODO]: DENY_SPECIAL_MOVES,
  [SpeciesId.TAUROS]: DENY_SPECIAL_MOVES,
  [SpeciesId.THROH]: DENY_SPECIAL_MOVES,
  [SpeciesId.TOGEDEMARU]: DENY_SPECIAL_MOVES,
  [SpeciesId.TORTERRA]: DENY_SPECIAL_MOVES,
  [SpeciesId.TSAREENA]: DENY_SPECIAL_MOVES,
  [SpeciesId.URSALUNA]: DENY_SPECIAL_MOVES,
  [SpeciesId.WEAVILE]: DENY_SPECIAL_MOVES,
  [SpeciesId.WUGTRIO]: DENY_SPECIAL_MOVES,

  // Legendaries/Megas, can be more lax
  [SpeciesId.REGIROCK]: DENY_SPECIAL_MOVES,
  [SpeciesId.REGIGIGAS]: DENY_SPECIAL_MOVES,
  [SpeciesId.KARTANA]: DENY_SPECIAL_MOVES,
  [SpeciesId.TAPU_BULU]: DENY_SPECIAL_MOVES,
  [SpeciesId.SOLGALEO]: DENY_SPECIAL_MOVES,
  [SpeciesId.BUZZWOLE]: DENY_SPECIAL_MOVES,
  [SpeciesId.STAKATAKA]: DENY_SPECIAL_MOVES,
  [SpeciesId.MELMETAL]: DENY_SPECIAL_MOVES,
  [SpeciesId.ZACIAN]: DENY_SPECIAL_MOVES,
  [SpeciesId.ZAMAZENTA]: DENY_SPECIAL_MOVES,
  [SpeciesId.GLASTRIER]: DENY_SPECIAL_MOVES,
  [SpeciesId.GREAT_TUSK]: DENY_SPECIAL_MOVES,
  [SpeciesId.IRON_HANDS]: DENY_SPECIAL_MOVES,
  [SpeciesId.TING_LU]: DENY_SPECIAL_MOVES,
  [SpeciesId.ROARING_MOON]: DENY_SPECIAL_MOVES,
  [SpeciesId.KORAIDON]: DENY_SPECIAL_MOVES,
  [SpeciesId.IRON_LEAVES]: DENY_SPECIAL_MOVES,
  [SpeciesId.OKIDOGI]: DENY_SPECIAL_MOVES,
  [SpeciesId.OGERPON]: DENY_SPECIAL_MOVES,
  [SpeciesId.GALAR_ZAPDOS]: DENY_SPECIAL_MOVES,

  [SpeciesId.GYARADOS]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.AERODACTYL]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.SWAMPERT]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.SHARPEDO]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.ABSOL]: { 2: DENY_SPECIAL_MOVES }, // Mega Z
  [SpeciesId.METAGROSS]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.LOPUNNY]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.GARCHOMP]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.BARBARACLE]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.SANDACONDA]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.CENTISKORCH]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.GRIMMSNARL]: { 1: DENY_SPECIAL_MOVES },
  [SpeciesId.COPPERAJAH]: { 1: DENY_SPECIAL_MOVES },
  //#endregion special deny list

  /* Species with multiple forms that need deny list on either form */
  [SpeciesId.NECROZMA]: {
    1: DENY_SPECIAL_MOVES, // Dusk Mane
    2: DENY_PHYSICAL_MOVES, // Dawn Wings
  },
  [SpeciesId.CALYREX]: {
    1: DENY_SPECIAL_MOVES, // Ice Rider
    2: DENY_PHYSICAL_MOVES, // Shadow Rider
  },
  [SpeciesId.CHARIZARD]: {
    1: DENY_SPECIAL_MOVES, // Mega Charizard X
    2: DENY_PHYSICAL_MOVES, // Mega Charizard Y
    3: DENY_PHYSICAL_MOVES, // Gigantamax Charizard
  },
  [SpeciesId.RAICHU]: {
    1: DENY_SPECIAL_MOVES, // Mega Raichu X
    2: DENY_PHYSICAL_MOVES, // Mega Raichu Y
  },
  [SpeciesId.MEWTWO]: {
    0: DENY_PHYSICAL_MOVES,
    1: DENY_SPECIAL_MOVES, // Mega Mewtwo X
    2: DENY_PHYSICAL_MOVES, // Mega Mewtwo Y
  },
};

/**
 * Query the offensive stat that is deined for the given species and form index.
 *
 * @remarks
 * If the species is not on the denylst,
 * @param species - The species under consideration
 * @param formIndex - The form index of the species
 * @returns The offensive stat category that should be denied, or `undefined` if there is none.
 * @see {@linkcode WORSE_OFFENSIVE_STAT_SPECIES_DENYLIST}
 */
export function getSpeciesDeniedOffensiveStat(
  species: SpeciesId,
  formIndex: number,
): typeof DENY_PHYSICAL_MOVES | typeof DENY_SPECIAL_MOVES | undefined {
  const denyList = WORSE_OFFENSIVE_STAT_SPECIES_DENYLIST[species];
  if (typeof denyList === "object") {
    return denyList[formIndex];
  }
  return denyList;
}

/**
 * Moves in this list will not be excluded from generating
 * on Pokémon that match this worse offensive stat.
 *
 * @remarks
 * Intended to be used for damaging moves that have useful utility,
 * like volt switch, stone-axe, etc.
 */
export const EXCLUDED_MOVES_FOR_WORSE_OFFENSIVE_STAT = new Set([
  MoveId.VOLT_SWITCH,
  MoveId.U_TURN,
  MoveId.FLIP_TURN,
  MoveId.NUZZLE,
  MoveId.CLEAR_SMOG,
  MoveId.SALT_CURE,
  MoveId.SAPPY_SEED,
  MoveId.GLITZY_GLOW,
  MoveId.SIZZLY_SLIDE,
  MoveId.BADDY_BAD,
  MoveId.STONE_AXE,
  MoveId.CEASELESS_EDGE,
  MoveId.BUZZY_BUZZ,
  MoveId.FREEZY_FROST,
  MoveId.TRAILBLAZE,
  MoveId.FLAME_CHARGE,
  MoveId.FAKE_OUT,
]);
