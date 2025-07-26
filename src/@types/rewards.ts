import type { Pokemon } from "#field/pokemon";
import type { Reward, RewardGenerator, WeightedReward } from "#items/reward";

export type RewardFunc = () => Reward | RewardGenerator;
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPool = {
  [tier: string]: WeightedReward[];
};
