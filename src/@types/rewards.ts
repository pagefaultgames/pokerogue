import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { AllRewardsType } from "#items/all-rewards";
import type { RewardGenerator } from "#items/reward";

// TODO: Remove party from arguments - can be accessed from `globalScene`
export type WeightedRewardWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

type AllRewardGenerators = {
  [k in keyof AllRewardsType as AllRewardsType[k] extends RewardGenerator ? k : never]: AllRewardsType[k];
};

type RewardGeneratorArgMap = {
  [k in keyof AllRewardGenerators]: NonNullable<Parameters<AllRewardGenerators[k]["generateReward"]>[0]>;
};

/** Union type containing all {@linkcode RewardId}s corresponding to valid {@linkcode RewardGenerator}s. */
type RewardGeneratorId = keyof AllRewardGenerators;

type RewardGeneratorSpecs<T extends RewardGeneratorId = RewardGeneratorId> = {
  id: T;
  args: RewardGeneratorArgMap[T];
};

/** Union type used to specify fixed rewards used in generation. */
// TODO: Rename from "specs" since this is only sometimes an object
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
