import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { Reward, RewardGenerator } from "#items/reward";

export type RewardFunc = () => Reward | RewardGenerator;
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

export type RewardPoolEntry = {
  id: RewardPoolId;
  weight: number | WeightedRewardWeightFunc;
};

export type RewardPool = {
  [tier: string]: RewardPoolEntry[];
};

export interface RewardPoolWeights {
  [tier: string]: number[];
}
