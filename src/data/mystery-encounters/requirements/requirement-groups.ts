import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";

/**
 * Moves that "steal" things
 */
export const STEALING_MOVES = [
  Moves.PLUCK,
  Moves.COVET,
  Moves.KNOCK_OFF,
  Moves.THIEF,
  Moves.TRICK,
  Moves.SWITCHEROO
];

/**
 * Moves that "charm" someone
 */
export const CHARMING_MOVES = [
  Moves.CHARM,
  Moves.FLATTER,
  Moves.DRAGON_CHEER,
  Moves.ALLURING_VOICE,
  Moves.ATTRACT,
  Moves.SWEET_SCENT,
  Moves.CAPTIVATE,
  Moves.AROMATIC_MIST
];

/**
 * Moves for the Dancer ability
 */
export const DANCING_MOVES = [
  Moves.AQUA_STEP,
  Moves.CLANGOROUS_SOUL,
  Moves.DRAGON_DANCE,
  Moves.FEATHER_DANCE,
  Moves.FIERY_DANCE,
  Moves.LUNAR_DANCE,
  Moves.PETAL_DANCE,
  Moves.REVELATION_DANCE,
  Moves.QUIVER_DANCE,
  Moves.SWORDS_DANCE,
  Moves.TEETER_DANCE,
  Moves.VICTORY_DANCE
];

/**
 * Moves that can distract someone/something
 */
export const DISTRACTION_MOVES = [
  Moves.FAKE_OUT,
  Moves.FOLLOW_ME,
  Moves.TAUNT,
  Moves.ROAR,
  Moves.TELEPORT,
  Moves.CHARM,
  Moves.FAKE_TEARS,
  Moves.TICKLE,
  Moves.CAPTIVATE,
  Moves.RAGE_POWDER,
  Moves.SUBSTITUTE,
  Moves.SHED_TAIL
];

/**
 * Moves that protect in some way
 */
export const PROTECTING_MOVES = [
  Moves.PROTECT,
  Moves.WIDE_GUARD,
  Moves.MAX_GUARD,
  Moves.SAFEGUARD,
  Moves.REFLECT,
  Moves.BARRIER,
  Moves.QUICK_GUARD,
  Moves.FLOWER_SHIELD,
  Moves.KINGS_SHIELD,
  Moves.CRAFTY_SHIELD,
  Moves.SPIKY_SHIELD,
  Moves.OBSTRUCT,
  Moves.DETECT
];

/**
 * Moves that (loosely) can be used to trap/rob someone
 */
export const EXTORTION_MOVES = [
  Moves.BIND,
  Moves.CLAMP,
  Moves.INFESTATION,
  Moves.SAND_TOMB,
  Moves.SNAP_TRAP,
  Moves.THUNDER_CAGE,
  Moves.WRAP,
  Moves.SPIRIT_SHACKLE,
  Moves.MEAN_LOOK,
  Moves.JAW_LOCK,
  Moves.BLOCK,
  Moves.SPIDER_WEB,
  Moves.ANCHOR_SHOT,
  Moves.OCTOLOCK,
  Moves.PURSUIT,
  Moves.CONSTRICT,
  Moves.BEAT_UP,
  Moves.COIL,
  Moves.WRING_OUT,
  Moves.STRING_SHOT,
];

/**
 * Abilities that (loosely) can be used to trap/rob someone
 */
export const EXTORTION_ABILITIES = [
  Abilities.INTIMIDATE,
  Abilities.ARENA_TRAP,
  Abilities.SHADOW_TAG,
  Abilities.SUCTION_CUPS,
  Abilities.STICKY_HOLD
];

/**
 * Abilities that signify resistance to fire
 */
export const FIRE_RESISTANT_ABILITIES = [
  Abilities.FLAME_BODY,
  Abilities.FLASH_FIRE,
  Abilities.WELL_BAKED_BODY,
  Abilities.HEATPROOF,
  Abilities.THERMAL_EXCHANGE,
  Abilities.THICK_FAT,
  Abilities.WATER_BUBBLE,
  Abilities.MAGMA_ARMOR
];
