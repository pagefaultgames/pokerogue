import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";

/**
 * Moves that "steal" things
 */
export const STEALING_MOVES = [
  MoveId.PLUCK,
  MoveId.COVET,
  MoveId.KNOCK_OFF,
  MoveId.THIEF,
  MoveId.TRICK,
  MoveId.SWITCHEROO,
];

/**
 * Moves that "charm" someone
 */
export const CHARMING_MOVES = [
  MoveId.CHARM,
  MoveId.FLATTER,
  MoveId.DRAGON_CHEER,
  MoveId.ALLURING_VOICE,
  MoveId.ATTRACT,
  MoveId.SWEET_SCENT,
  MoveId.CAPTIVATE,
  MoveId.AROMATIC_MIST,
];

/**
 * Moves for the Dancer ability
 */
export const DANCING_MOVES = [
  MoveId.AQUA_STEP,
  MoveId.CLANGOROUS_SOUL,
  MoveId.DRAGON_DANCE,
  MoveId.FEATHER_DANCE,
  MoveId.FIERY_DANCE,
  MoveId.LUNAR_DANCE,
  MoveId.PETAL_DANCE,
  MoveId.REVELATION_DANCE,
  MoveId.QUIVER_DANCE,
  MoveId.SWORDS_DANCE,
  MoveId.TEETER_DANCE,
  MoveId.VICTORY_DANCE,
];

/**
 * Moves that can distract someone/something
 */
export const DISTRACTION_MOVES = [
  MoveId.FAKE_OUT,
  MoveId.FOLLOW_ME,
  MoveId.TAUNT,
  MoveId.ROAR,
  MoveId.TELEPORT,
  MoveId.CHARM,
  MoveId.FAKE_TEARS,
  MoveId.TICKLE,
  MoveId.CAPTIVATE,
  MoveId.RAGE_POWDER,
  MoveId.SUBSTITUTE,
  MoveId.SHED_TAIL,
];

/**
 * Moves that protect in some way
 */
export const PROTECTING_MOVES = [
  MoveId.PROTECT,
  MoveId.WIDE_GUARD,
  MoveId.MAX_GUARD,
  MoveId.SAFEGUARD,
  MoveId.REFLECT,
  MoveId.BARRIER,
  MoveId.QUICK_GUARD,
  MoveId.FLOWER_SHIELD,
  MoveId.KINGS_SHIELD,
  MoveId.CRAFTY_SHIELD,
  MoveId.SPIKY_SHIELD,
  MoveId.OBSTRUCT,
  MoveId.DETECT,
];

/**
 * Moves that (loosely) can be used to trap/rob someone
 */
export const EXTORTION_MOVES = [
  MoveId.BIND,
  MoveId.CLAMP,
  MoveId.INFESTATION,
  MoveId.SAND_TOMB,
  MoveId.SNAP_TRAP,
  MoveId.THUNDER_CAGE,
  MoveId.WRAP,
  MoveId.SPIRIT_SHACKLE,
  MoveId.MEAN_LOOK,
  MoveId.JAW_LOCK,
  MoveId.BLOCK,
  MoveId.SPIDER_WEB,
  MoveId.ANCHOR_SHOT,
  MoveId.OCTOLOCK,
  MoveId.PURSUIT,
  MoveId.CONSTRICT,
  MoveId.BEAT_UP,
  MoveId.COIL,
  MoveId.WRING_OUT,
  MoveId.STRING_SHOT,
];

/**
 * Abilities that (loosely) can be used to trap/rob someone
 */
export const EXTORTION_ABILITIES = [
  AbilityId.INTIMIDATE,
  AbilityId.ARENA_TRAP,
  AbilityId.SHADOW_TAG,
  AbilityId.SUCTION_CUPS,
  AbilityId.STICKY_HOLD,
];

/**
 * Abilities that signify resistance to fire
 */
export const FIRE_RESISTANT_ABILITIES = [
  AbilityId.FLAME_BODY,
  AbilityId.FLASH_FIRE,
  AbilityId.WELL_BAKED_BODY,
  AbilityId.HEATPROOF,
  AbilityId.THERMAL_EXCHANGE,
  AbilityId.THICK_FAT,
  AbilityId.WATER_BUBBLE,
  AbilityId.MAGMA_ARMOR,
  AbilityId.WATER_VEIL,
  AbilityId.STEAM_ENGINE,
  AbilityId.PRIMORDIAL_SEA,
];
