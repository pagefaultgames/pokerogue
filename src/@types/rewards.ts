import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { Reward, RewardGenerator } from "#items/reward";

export type RewardFunc = () => Reward | RewardGenerator;
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

export type RewardGeneratorSpecs = {
  id: RewardId;
  args: RewardGeneratorArgs;
};
// TODO: fix this with correctly typed args for different RewardIds

export type RewardSpecs = RewardPoolId | RewardGeneratorSpecs;

export type RewardPoolEntry = {
  id: RewardPoolId;
  weight: number | WeightedRewardWeightFunc;
  maxWeight?: number;
};

export type RewardPool = {
  [tier: string]: RewardPoolEntry[];
};

export interface RewardPoolWeights {
  [tier: string]: number[];
}
