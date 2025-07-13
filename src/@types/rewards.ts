// Intentionally re-exports `ModifierConstructorMap` from `modifier.ts`

import type { Pokemon } from "#field/pokemon";
import type { ModifierConstructorMap } from "#items/consumable";
import type { Reward, WeightedReward } from "#items/reward";

export type RewardFunc = () => Reward;
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type { ModifierConstructorMap } from "#items/consumable";

/**
 * Map of modifier names to their respective instance types
 */
export type ModifierInstanceMap = {
  [K in keyof ModifierConstructorMap]: InstanceType<ModifierConstructorMap[K]>;
};

/**
 * Union type of all modifier constructors.
 */
export type ModifierClass = ModifierConstructorMap[keyof ModifierConstructorMap];

/**
 * Union type of all modifier names as strings.
 */
export type ModifierString = keyof ModifierConstructorMap;

export type RewardPool = {
  [tier: string]: WeightedReward[];
};
