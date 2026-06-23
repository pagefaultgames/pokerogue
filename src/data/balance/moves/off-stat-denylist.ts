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
 * If a species (or species, form index combination) is on this list
 * moves will not be generated for it. Putting a species here will block moves of
 * the category for all forms. To only block for a specific form, use
 * the tuple of the form `[speciesId, formIndex]` as the key.
 *
 *
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
export const WORSE_OFFENSIVE_STAT_SPECIES_DENYLIST = new Map<
  SpeciesId | [SpeciesId, number],
  typeof DENY_PHYSICAL_MOVES | typeof DENY_SPECIAL_MOVES
>([
  //#region physical deny list
  [SpeciesId.EMPOLEON, DENY_PHYSICAL_MOVES],
  [SpeciesId.DELPHOX, DENY_PHYSICAL_MOVES],
  [SpeciesId.PRIMARINA, DENY_PHYSICAL_MOVES],
  [SpeciesId.SKELEDIRGE, DENY_PHYSICAL_MOVES],
  [SpeciesId.INTELEON, DENY_PHYSICAL_MOVES],
  [SpeciesId.GENGAR, DENY_PHYSICAL_MOVES],
  [SpeciesId.ALAKAZAM, DENY_PHYSICAL_MOVES],
  [SpeciesId.MAGNEZONE, DENY_PHYSICAL_MOVES],
  [SpeciesId.BUTTERFREE, DENY_PHYSICAL_MOVES],
  [SpeciesId.SYLVEON, DENY_PHYSICAL_MOVES],
  [SpeciesId.CHANDELURE, DENY_PHYSICAL_MOVES],
  [SpeciesId.BLOODMOON_URSALUNA, DENY_PHYSICAL_MOVES],
  [SpeciesId.GHOLDENGO, DENY_PHYSICAL_MOVES],
  [SpeciesId.GLIMMORA, DENY_PHYSICAL_MOVES],
  [SpeciesId.FLORGES, DENY_PHYSICAL_MOVES],
  [SpeciesId.TOGEKISS, DENY_PHYSICAL_MOVES],
  [SpeciesId.ESPEON, DENY_PHYSICAL_MOVES],
  [SpeciesId.JOLTEON, DENY_PHYSICAL_MOVES],
  [SpeciesId.MUSHARNA, DENY_PHYSICAL_MOVES],
  [SpeciesId.ESPATHRA, DENY_PHYSICAL_MOVES],
  [SpeciesId.DRAMPA, DENY_PHYSICAL_MOVES],
  [SpeciesId.BELLIBOLT, DENY_PHYSICAL_MOVES],
  [SpeciesId.MILOTIC, DENY_PHYSICAL_MOVES],
  [SpeciesId.MASQUERAIN, DENY_PHYSICAL_MOVES],
  [SpeciesId.TATSUGIRI, DENY_PHYSICAL_MOVES],
  [SpeciesId.RABSCA, DENY_PHYSICAL_MOVES],
  [SpeciesId.ROSERADE, DENY_PHYSICAL_MOVES],
  [SpeciesId.VOLCARONA, DENY_PHYSICAL_MOVES],
  [SpeciesId.ARMAROUGE, DENY_PHYSICAL_MOVES],
  [SpeciesId.SALAZZLE, DENY_PHYSICAL_MOVES],
  [SpeciesId.REUNICLUS, DENY_PHYSICAL_MOVES],
  [SpeciesId.FROSMOTH, DENY_PHYSICAL_MOVES],
  [SpeciesId.INDEEDEE, DENY_PHYSICAL_MOVES],
  [SpeciesId.VIKAVOLT, DENY_PHYSICAL_MOVES],
  [SpeciesId.MR_MIME, DENY_PHYSICAL_MOVES],
  [SpeciesId.HYDRAPPLE, DENY_PHYSICAL_MOVES],
  [SpeciesId.HYDREIGON, DENY_PHYSICAL_MOVES],
  [SpeciesId.ALOLA_RAICHU, DENY_PHYSICAL_MOVES],

  // Megas / legendaries
  [SpeciesId.ETERNAL_FLOETTE, DENY_PHYSICAL_MOVES],
  [SpeciesId.LUGIA, DENY_PHYSICAL_MOVES],
  [SpeciesId.FLUTTER_MANE, DENY_PHYSICAL_MOVES],
  [SpeciesId.MIRAIDON, DENY_PHYSICAL_MOVES],
  [SpeciesId.XURKITREE, DENY_PHYSICAL_MOVES],
  [SpeciesId.LUNALA, DENY_PHYSICAL_MOVES],
  [SpeciesId.KELDEO, DENY_PHYSICAL_MOVES],
  [SpeciesId.TAPU_LELE, DENY_PHYSICAL_MOVES],
  [SpeciesId.GALAR_ARTICUNO, DENY_PHYSICAL_MOVES],
  [SpeciesId.GALAR_MOLTRES, DENY_PHYSICAL_MOVES],
  [SpeciesId.ARTICUNO, DENY_PHYSICAL_MOVES],
  [SpeciesId.ZAPDOS, DENY_PHYSICAL_MOVES],
  [SpeciesId.MOLTRES, DENY_PHYSICAL_MOVES],
  [SpeciesId.TERAPAGOS, DENY_PHYSICAL_MOVES],
  [SpeciesId.IRON_JUGULIS, DENY_PHYSICAL_MOVES],
  [[SpeciesId.CLEFABLE, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.PIDGEOT, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.MANECTRIC, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.CALYREX, 2], DENY_PHYSICAL_MOVES], // Calyrex Shadow Rider
  [[SpeciesId.GARDEVOIR, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.AMPHAROS, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.CAMERUPT, 1], DENY_PHYSICAL_MOVES], // Because sheer force physical moves bad
  [[SpeciesId.HOUNDOOM, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.SLOWBRO, 1], DENY_PHYSICAL_MOVES],
  [[SpeciesId.DRAGONITE, 1], DENY_PHYSICAL_MOVES],
  //#endregion physical deny list

  //#region special deny list
  [SpeciesId.TORTERRA, DENY_SPECIAL_MOVES],
  [SpeciesId.EMBOAR, DENY_SPECIAL_MOVES],
  [SpeciesId.CHESNAUGHT, DENY_SPECIAL_MOVES],
  [SpeciesId.INCINEROAR, DENY_SPECIAL_MOVES],
  [SpeciesId.MEOWSCARADA, DENY_SPECIAL_MOVES],
  [SpeciesId.QUAQUAVAL, DENY_SPECIAL_MOVES],
  [SpeciesId.GOLISOPOD, DENY_SPECIAL_MOVES],
  [SpeciesId.GIGALITH, DENY_SPECIAL_MOVES],
  [SpeciesId.HAXORUS, DENY_SPECIAL_MOVES],
  [SpeciesId.CONKELDURR, DENY_SPECIAL_MOVES],
  [SpeciesId.EXCADRILL, DENY_SPECIAL_MOVES],
  [[SpeciesId.ABSOL, 0], DENY_SPECIAL_MOVES],
  [SpeciesId.MACHAMP, DENY_SPECIAL_MOVES],
  [SpeciesId.DUSKNOIR, DENY_SPECIAL_MOVES],
  [SpeciesId.DRAPION, DENY_SPECIAL_MOVES],
  [SpeciesId.HERACROSS, DENY_SPECIAL_MOVES],
  [SpeciesId.CRABOMINABLE, DENY_SPECIAL_MOVES],
  [SpeciesId.BEEDRILL, DENY_SPECIAL_MOVES],
  [SpeciesId.DARMANITAN, DENY_SPECIAL_MOVES],
  [SpeciesId.STONJOURNER, DENY_SPECIAL_MOVES],
  [SpeciesId.HITMONLEE, DENY_SPECIAL_MOVES],
  [SpeciesId.HITMONCHAN, DENY_SPECIAL_MOVES],
  [SpeciesId.HITMONTOP, DENY_SPECIAL_MOVES],
  [SpeciesId.HARIYAMA, DENY_SPECIAL_MOVES],
  [SpeciesId.MEDICHAM, DENY_SPECIAL_MOVES],
  [SpeciesId.SNEASLER, DENY_SPECIAL_MOVES],
  [SpeciesId.PASSIMIAN, DENY_SPECIAL_MOVES],
  [SpeciesId.BOUFFALANT, DENY_SPECIAL_MOVES],
  [SpeciesId.URSALUNA, DENY_SPECIAL_MOVES],
  [SpeciesId.RHYPERIOR, DENY_SPECIAL_MOVES],
  [SpeciesId.SCYTHER, DENY_SPECIAL_MOVES],
  [SpeciesId.SCIZOR, DENY_SPECIAL_MOVES],
  [SpeciesId.KLEAVOR, DENY_SPECIAL_MOVES],
  [SpeciesId.PINSIR, DENY_SPECIAL_MOVES],
  [SpeciesId.SIRFETCHD, DENY_SPECIAL_MOVES],
  [SpeciesId.AGGRON, DENY_SPECIAL_MOVES],
  [SpeciesId.KANGASKHAN, DENY_SPECIAL_MOVES],
  [SpeciesId.SUDOWOODO, DENY_SPECIAL_MOVES],
  [SpeciesId.WEAVILE, DENY_SPECIAL_MOVES],
  [SpeciesId.GLISCOR, DENY_SPECIAL_MOVES],
  [SpeciesId.STOUTLAND, DENY_SPECIAL_MOVES],
  [SpeciesId.KROOKODILE, DENY_SPECIAL_MOVES],
  [SpeciesId.SNORLAX, DENY_SPECIAL_MOVES],
  [SpeciesId.GOLURK, DENY_SPECIAL_MOVES],
  [SpeciesId.CERULEDGE, DENY_SPECIAL_MOVES],
  [SpeciesId.KINGAMBIT, DENY_SPECIAL_MOVES],
  [SpeciesId.AVALUGG, DENY_SPECIAL_MOVES],
  [SpeciesId.HISUI_AVALUGG, DENY_SPECIAL_MOVES],
  [SpeciesId.DUGTRIO, DENY_SPECIAL_MOVES],
  [SpeciesId.WUGTRIO, DENY_SPECIAL_MOVES],
  [SpeciesId.ALOLA_DUGTRIO, DENY_SPECIAL_MOVES],
  [SpeciesId.DODRIO, DENY_SPECIAL_MOVES],
  [SpeciesId.HISUI_LILLIGANT, DENY_SPECIAL_MOVES],
  [SpeciesId.TSAREENA, DENY_SPECIAL_MOVES],
  [SpeciesId.PALDEA_TAUROS, DENY_SPECIAL_MOVES],
  [SpeciesId.DREDNAW, DENY_SPECIAL_MOVES],
  [SpeciesId.MUK, DENY_SPECIAL_MOVES],
  [SpeciesId.ALOLA_MUK, DENY_SPECIAL_MOVES],

  // Legendaries/Megas, can be more lax
  [SpeciesId.TAPU_BULU, DENY_SPECIAL_MOVES],
  [SpeciesId.SOLGALEO, DENY_SPECIAL_MOVES],
  [SpeciesId.MELMETAL, DENY_SPECIAL_MOVES],
  [SpeciesId.ZACIAN, DENY_SPECIAL_MOVES],
  [SpeciesId.ZAMAZENTA, DENY_SPECIAL_MOVES],
  [SpeciesId.KORAIDON, DENY_SPECIAL_MOVES],
  [SpeciesId.GALAR_ZAPDOS, DENY_SPECIAL_MOVES],
  [SpeciesId.IRON_LEAVES, DENY_SPECIAL_MOVES],
  [[SpeciesId.GARCHOMP, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.BAXCALIBUR, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.SANDACONDA, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.SWAMPERT, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.CENTISKORCH, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.GALLADE, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.CALYREX, 1], DENY_SPECIAL_MOVES], // Calyrex Ice Rider
  [[SpeciesId.LOPUNNY, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.AERODACTYL, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.GYARADOS, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.METAGROSS, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.STEELIX, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.SHARPEDO, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.SWAMPERT, 1], DENY_SPECIAL_MOVES],
  [[SpeciesId.COPPERAJAH, 1], DENY_SPECIAL_MOVES],
  //#endregion special deny list
]);

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
  MoveId.BADDY_BAD,
  MoveId.STONE_AXE,
  MoveId.CEASELESS_EDGE,
  MoveId.BUZZY_BUZZ,
  MoveId.FREEZY_FROST,
  MoveId.TRAILBLAZE,
  MoveId.FLAME_CHARGE,
]);
