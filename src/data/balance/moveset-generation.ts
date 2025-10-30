/*
 * SPDX-Copyright-Text: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * # Balance: Moveset Generation Configuration
 *
 * This module contains configuration constants and functions that control
 * the limitations and rules around moveset generation for generated Pokémon.
 *
 *
 * ### Move Weights
 *
 * The various move weight constants in this module control how likely
 * certain categories of moves are to appear in a generated Pokémon's
 * moveset. Higher weights make a move more likely to be chosen.
 * The constants here specify the *base* weight for a move when first computed.
 * These weights are post-processed (and then scaled up such that weights have a larger impact,
 * for instance, on boss Pokémon) before being used in the actual moveset generation.
 *
 * Post Processing of weights includes, but is not limited to:
 * - Adjusting weights of status moves
 * - Adjusting weights based on the move's power relative to the highest power available
 * - Adjusting weights based on the stat the move uses to calculate damage relative to the higher stat
 *
 *
 * All weights go through additional post-processing based on
 * their expected power (accuracy * damage * expected number of hits)
 *
 * @module
 */

import { MoveId } from "#enums/move-id";


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


/** The weight given to TMs in the common tier during moveset generation */
export const COMMON_TM_MOVESET_WEIGHT = 12;
/** The weight given to TMs in the great tier during moveset generation */
export const GREAT_TM_MOVESET_WEIGHT = 14;
/** The weight given to TMs in the ultra tier during moveset generation */
export const ULTRA_TM_MOVESET_WEIGHT = 18;

/**
 * The base weight offset for level moves
 *
 * @remarks
 * The relative likelihood of moves learned at different levels is determined by
 * the ratio of their weights,
 * or, the formula:
 * `(levelB + BASE_LEVEL_WEIGHT_OFFSET) / (levelA + BASE_LEVEL_WEIGHT_OFFSET)`
 *
 * For example, consider move A and B that are learned at levels 1 and 60, respectively,
 * but have no other differences (same power, accuracy, category, etc).
 * The following table demonstrates the likelihood of move B being chosen over move A.
 *
 * | Offset | Likelihood |
 * |--------|------------|
 * |   0    |    60x     |
 * |   1    |    30x     |
 * |   5    |    10.8x   |
 * |   20   |    3.8x    |
 * |   60   |    2x      |
 *
 * Note that increasing this without adjusting the other weights will decrease the likelihood of non-level moves
 *
 * For a complete picture, see {@link https://www.desmos.com/calculator/wgln4dxigl}
 */
export const BASE_LEVEL_WEIGHT_OFFSET = 20;

/**
 * The maximum weight an egg move can ever have
 * @remarks
 * Egg moves have their weights adjusted based on the maximum weight of the Pokémon's
 * level-up moves. Rare Egg moves are always 5/6th of the computed egg move weight.
 * Boss pokemon are not allowed to spawn with rare egg moves.
 * @see {@linkcode EGG_MOVE_TO_LEVEL_WEIGHT}
 */
export const EGG_MOVE_WEIGHT_MAX = 60;
/**
 * The percentage of the Pokémon's highest weighted level move to the weight an
 * egg move can generate with
 */
export const EGG_MOVE_TO_LEVEL_WEIGHT = 0.85;
/** The weight given to evolution moves */
export const EVOLUTION_MOVE_WEIGHT = 70;
/** The weight given to relearn moves */
export const RELEARN_MOVE_WEIGHT = 60;

/** The base weight multiplier to use
 *
 * The higher the number, the more impact weights have on the final move selection.
 * i.e. if set to 0, all moves have equal chance of being selected regardless of their weight.
 */
export const BASE_WEIGHT_MULTIPLIER = 1.6;

/** The additional weight added onto {@linkcode BASE_WEIGHT_MULTIPLIER} for boss Pokémon */
export const BOSS_EXTRA_WEIGHT_MULTIPLIER = 0.4;



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
  MoveId.POWER_TRIP,
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
  MoveId.STORED_POWER,
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
