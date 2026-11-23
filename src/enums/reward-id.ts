import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { RewardPoolId } from "#types/rewards";
import type { ValueOf } from "type-fest";

/**
 * Map of all reward names to their IDs.
 *
 * @remarks
 * Entries are formatted `0xXXYY`, where `XX` is the {@linkcode RewardCategoryId | category} and `YY` is the
 * reward's offset within that category.
 *
 * Rewards granting a single specific held or trainer item use that item's ID directly and have no `RewardId`.
 */
export const RewardId = {
  POKEBALL: 0x2001,
  GREAT_BALL: 0x2002,
  ULTRA_BALL: 0x2003,
  ROGUE_BALL: 0x2004,
  MASTER_BALL: 0x2005,

  VOUCHER: 0x2101,
  VOUCHER_PLUS: 0x2102,
  VOUCHER_PREMIUM: 0x2103,

  NUGGET: 0x2201,
  BIG_NUGGET: 0x2202,
  RELIC_GOLD: 0x2203,

  RARE_CANDY: 0x2301,
  RARER_CANDY: 0x2302,

  EVOLUTION_ITEM: 0x2401,
  RARE_EVOLUTION_ITEM: 0x2402,

  POTION: 0x2501,
  SUPER_POTION: 0x2502,
  HYPER_POTION: 0x2503,
  MAX_POTION: 0x2504,
  FULL_HEAL: 0x2505,
  FULL_RESTORE: 0x2506,

  REVIVE: 0x2601,
  MAX_REVIVE: 0x2602,
  SACRED_ASH: 0x2603,

  ETHER: 0x2701,
  MAX_ETHER: 0x2702,

  ELIXIR: 0x2801,
  MAX_ELIXIR: 0x2802,

  PP_UP: 0x2901,
  PP_MAX: 0x2902,

  TM_COMMON: 0x2a01,
  TM_GREAT: 0x2a02,
  TM_ULTRA: 0x2a03,

  MINT: 0x2b01,
  TERA_SHARD: 0x2b02,
  MEMORY_MUSHROOM: 0x2b03,
  DNA_SPLICERS: 0x2b04,

  // Held item generators
  SPECIES_STAT_BOOSTER: 0x2c01,
  RARE_SPECIES_STAT_BOOSTER: 0x2c02,
  VITAMIN: 0x2c03,
  ATTACK_TYPE_BOOSTER: 0x2c04,
  BERRY: 0x2c05,

  // Trainer item generators
  TEMP_STAT_STAGE_BOOSTER: 0x2d01,

  FORM_CHANGE_ITEM: 0x2e01,
  RARE_FORM_CHANGE_ITEM: 0x2e02,
} as const;

export type RewardId = ValueOf<typeof RewardId>;

export const RewardCategoryId = {
  POKEBALL: 0x2000,
  VOUCHER: 0x2100,
  MONEY: 0x2200,
  CANDY: 0x2300,
  EVOLUTION_ITEM: 0x2400,
  HEALING: 0x2500,
  REVIVE: 0x2600,
  ETHER: 0x2700,
  ELIXIR: 0x2800,
  PP_UP: 0x2900,
  TM: 0x2a00,
  OTHER: 0x2b00,
  HELD_ITEM: 0x2c00,
  TRAINER_ITEM: 0x2d00,
  FORM_CHANGE_ITEM: 0x2e00,
} as const;

export type RewardCategoryId = ValueOf<typeof RewardCategoryId>;

/** Bitmask extracting the category (high byte) from a reward ID. */
const REWARD_CATEGORY_MASK = 0xff00;

const TRAINER_ITEM_ID_START = 0x1000;
const REWARD_ID_START = 0x2000;

// #region Pool ID guards

/**
 * Guard for whether a pool ID refers to a held item.
 * @param id - The {@linkcode RewardPoolId} to check
 */
export function isHeldItemId(id: RewardPoolId): id is HeldItemId {
  return id < TRAINER_ITEM_ID_START;
}

/**
 * Guard for whether a pool ID refers to a trainer item.
 * @param id - The {@linkcode RewardPoolId} to check
 */
export function isTrainerItemId(id: RewardPoolId): id is TrainerItemId {
  return id >= TRAINER_ITEM_ID_START && id < REWARD_ID_START;
}

/**
 * Guard for whether a pool ID refers to a standalone reward (i.e. an entry of `allRewards`).
 * @param id - The {@linkcode RewardPoolId} to check
 */
export function isRewardId(id: RewardPoolId): id is RewardId {
  return id >= REWARD_ID_START;
}

// #endregion Pool ID guards

/**
 * Get the {@linkcode RewardCategoryId} of a pool ID.
 * @param id - The {@linkcode RewardPoolId} to classify
 */
export function getRewardCategory(id: RewardPoolId): RewardCategoryId {
  if (isHeldItemId(id)) {
    return RewardCategoryId.HELD_ITEM;
  }
  if (isTrainerItemId(id)) {
    return RewardCategoryId.TRAINER_ITEM;
  }
  return (id & REWARD_CATEGORY_MASK) as RewardCategoryId;
}

type Assert<T extends true> = T;

// biome-ignore lint/correctness/noUnusedVariables: Compile time verifier
type EnsureNoIdCollision = [
  // No reward ID equals a held item ID
  Assert<RewardId & HeldItemId>,
  // No reward ID equals a trainer item ID
  Assert<RewardId & TrainerItemId>,
  // No reward ID equals a reward category ID
  Assert<RewardId & RewardCategoryId>,
];
