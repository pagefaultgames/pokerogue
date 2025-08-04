import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { Reward, RewardGenerator } from "#items/reward";
import type { allRewardsType } from "#types/all-reward-type";

export type RewardFunc = () => Reward | RewardGenerator;
// TODO: Remove party from arguments can be accessed from `globalScene`
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

type allRewardsInstanceMap = {
  [k in keyof allRewardsType as ReturnType<allRewardsType[k]> extends RewardGenerator ? k : never]: ReturnType<
    allRewardsType[k]
  >;
};

export type RewardGeneratorArgMap = {
  [k in keyof allRewardsInstanceMap]: Exclude<Parameters<allRewardsInstanceMap[k]["generateReward"]>[0], undefined>;
};

/** Union type containing all `RewardId`s corresponding to valid {@linkcode RewardGenerator}s. */
export type RewardGeneratorId = keyof allRewardsInstanceMap;

// TODO: SOrt out which types can and cannot be exported
export type RewardGeneratorSpecs<T extends RewardGeneratorId = RewardGeneratorId> = {
  id: T;
  args: RewardGeneratorArgMap[T];
};

export type RewardSpecs<T extends RewardPoolId = RewardPoolId> = T extends RewardGeneratorId
  ? T | RewardGeneratorSpecs<T>
  : T;

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
