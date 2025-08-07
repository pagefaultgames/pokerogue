import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { allRewardsType } from "#items/all-rewards";
import type { RewardGenerator } from "#items/reward";

// TODO: Remove party from arguments can be accessed from `globalScene`
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

type allRewardGenerators = {
  [k in keyof allRewardsType as allRewardsType[k] extends RewardGenerator ? k : never]: allRewardsType[k];
};

type RewardGeneratorArgMap = {
  [k in keyof allRewardGenerators]: Exclude<Parameters<allRewardGenerators[k]["generateReward"]>[0], undefined>;
};

/** Union type containing all {@linkcode RewardId}s corresponding to valid {@linkcode RewardGenerator}s. */
type RewardGeneratorId = keyof allRewardGenerators;

type RewardGeneratorSpecs<T extends RewardGeneratorId = RewardGeneratorId> = {
  id: T;
  args: RewardGeneratorArgMap[T];
};

/** Union type used to specify fixed rewards used in generation. */
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

export type SilentReward =
  | TrainerItemId
  | typeof RewardId.VOUCHER
  | typeof RewardId.VOUCHER_PLUS
  | typeof RewardId.VOUCHER_PREMIUM
  | typeof RewardId.ROGUE_BALL;
