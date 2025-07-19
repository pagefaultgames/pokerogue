// Intentionally re-exports `ModifierConstructorMap` from `modifier.ts`

import type { Pokemon } from "#field/pokemon";
import type { Reward, WeightedReward } from "#items/reward";

export type RewardFunc = () => Reward;
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPool = {
  [tier: string]: WeightedReward[];
};
