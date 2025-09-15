/*
 * SPDX-Copyright-Text: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MoveId } from "#enums/move-id";


/**
 * # Balance: Moveset Generation Configuration
 *
 * This module contains configuration constants and functions that control
 * the limitations and rules around moveset generation for generated Pokémon.
 *
 * @module
 */


//#region Constants
/**
 * The minimum level for a Pokémon to generate with a move it can only learn
 * from a common tier TM
 */
export const COMMON_TIER_TM_LEVEL_REQUIREMENT = 25;
/**
 * The minimum level for a Pokémon to generate with a move it can only learn
 * from a great tier TM
 */
export const GREAT_TIER_TM_LEVEL_REQUIREMENT = 40;
/**
 * The minimum level for a Pokémon to generate with a move it can only learn
 * from an ultra tier TM
 */
export const ULTRA_TIER_TM_LEVEL_REQUIREMENT = 55;

/** Below this level, Pokémon will be unable to generate with any egg moves */
export const EGG_MOVE_LEVEL_REQUIREMENT = 60;
/** Below this level, Pokémon will be unable to generate with rare egg moves */
export const RARE_EGG_MOVE_LEVEL_REQUIREMENT = 170;

// Note: Not exported, only for use with `getMaxTmCount
/** Below this level, Pokémon will be unable to generate with any TMs */
const ONE_TM_THRESHOLD = 25;
/** Below this level, Pokémon will generate with at most 1 TM */
const TWO_TM_THRESHOLD = 41;
/** Below this level, Pokémon will generate with at most two TMs */
const THREE_TM_THRESHOLD = 71;
/** Below this level, Pokémon will generate with at most three TMs */
const FOUR_TM_THRESHOLD = 101;

/** Below this level, Pokémon will be unable to generate any egg moves */
const ONE_EGG_MOVE_THRESHOLD = 80;
/** Below this level, Pokémon will generate with at most 1 egg moves */
const TWO_EGG_MOVE_THRESHOLD = 121;
/** Below this level, Pokémon will generate with at most 2 egg moves */
const THREE_EGG_MOVE_THRESHOLD = 161;
/** Above this level, Pokémon will generate with at most 3 egg moves */
const FOUR_EGG_MOVE_THRESHOLD = 201;


/**
 * Set of moves that should be blacklisted from the forced STAB during moveset generation
 *
 * @remarks
 * During moveset generation, trainer pokemon attempt to force their pokemon to generate with STAB
 * moves in their movesets. Moves in this list not be considered to be "STAB" moves for this purpose.
 * This does *not* prevent them from appearing in the moveset, but they will never
 * be selected as a forced STAB move.
 */
export const STAB_BLACKLIST: ReadonlySet<MoveId> = new Set([
  MoveId.BEAT_UP,
  MoveId.BELCH,
  MoveId.BIDE,
  MoveId.COMEUPPANCE,
  MoveId.COUNTER,
  MoveId.DOOM_DESIRE,
  MoveId.DRAGON_RAGE,
  MoveId.DREAM_EATER,
  MoveId.ENDEAVOR,
  MoveId.EXPLOSION,
  MoveId.FAKE_OUT,
  MoveId.FIRST_IMPRESSION,
  MoveId.FISSURE,
  MoveId.FLING,
  MoveId.FOCUS_PUNCH,
  MoveId.FUTURE_SIGHT,
  MoveId.GUILLOTINE,
  MoveId.HOLD_BACK,
  MoveId.HORN_DRILL,
  MoveId.LAST_RESORT,
  MoveId.METAL_BURST,
  MoveId.MIRROR_COAT,
  MoveId.MISTY_EXPLOSION,
  MoveId.NATURAL_GIFT,
  MoveId.NATURES_MADNESS,
  MoveId.NIGHT_SHADE,
  MoveId.PSYWAVE,
  MoveId.RUINATION,
  MoveId.SELF_DESTRUCT,
  MoveId.SHEER_COLD,
  MoveId.SHELL_TRAP,
  MoveId.SKY_DROP,
  MoveId.SNORE,
  MoveId.SONIC_BOOM,
  MoveId.SPIT_UP,
  MoveId.STEEL_BEAM,
  MoveId.STEEL_ROLLER,
  MoveId.SUPER_FANG,
  MoveId.SYNCHRONOISE,
  MoveId.UPPER_HAND,
]);

//#endregion Constants

/**
 * Get the maximum number of TMs a Pokémon is allowed to learn based on
 * its level
 * @param level - The level of the Pokémon
 * @returns The number of TMs the Pokémon can learn at this level
 */
export function getMaxTmCount(level: number) {
  if (level < ONE_TM_THRESHOLD) {
    return 0;
  }
  if (level < TWO_TM_THRESHOLD) {
    return 1;
  }
  if (level < THREE_TM_THRESHOLD) {
    return 2;
  }
  if (level < FOUR_TM_THRESHOLD) {
    return 3;
  }
  return 4;
}


export function getMaxEggMoveCount(level: number): number {
  if (level < ONE_EGG_MOVE_THRESHOLD) {
    return 0;
  }
  if (level < TWO_EGG_MOVE_THRESHOLD) {
    return 1;
  }
  if (level < THREE_EGG_MOVE_THRESHOLD) {
    return 2;
  }
  if (level < FOUR_EGG_MOVE_THRESHOLD) {
    return 3;
  }
  return 4;
}
