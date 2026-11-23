import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { AllRewardsType } from "#items/all-rewards";
import type { HeldItemReward } from "#items/held-item-reward";
import type { Reward, RewardGenerator } from "#items/reward";
import { createRewardFromSpecs } from "#items/reward-utils";
import type { TrainerItemReward } from "#items/trainer-item-reward";
import type { RewardConfiguration } from "#types/rewards";

// Type used to parse allRewards and convert generators into their return values
type AllRewardsRewardType = {
  [k in keyof AllRewardsType]: AllRewardsType[k] extends RewardGenerator
    ? ReturnType<AllRewardsType[k]["generateReward"]>
    : AllRewardsType[k];
};

/**
 * Dynamically generate a {@linkcode Reward} from a given {@linkcode RewardId}.
 * @param id - The {@linkcode RewardId} used to generate the reward
 * @returns The generated {@linkcode Reward}
 * @example
 * ```ts
 * const reward = generateRewardForTest(RewardId.BERRY);
 * ```
 */
export function generateRewardForTest<T extends RewardId>(id: T): AllRewardsRewardType[T];
/**
 * Dynamically generate a {@linkcode Reward} from a given {@linkcode HeldItemId}.
 * @param id - The {@linkcode HeldItemId | ID} of the held item to generate
 * @returns The generated {@linkcode HeldItemReward}
 * @example
 * ```ts
 * const reward = generateRewardForTest(HeldItemId.REVIVER_SEED);
 * ```
 */
export function generateRewardForTest<T extends HeldItemId>(id: T): HeldItemReward;
/**
 * Dynamically generate a {@linkcode Reward} from a given {@linkcode TrainerItemId}.
 * @param id - The {@linkcode TrainerItemId | ID} of the trainer item to generate
 * @returns The generated {@linkcode TrainerItemReward}
 * @example
 * ```ts
 * const reward = generateRewardForTest(TrainerItemId.HEALING_CHARM);
 * ```
 */
export function generateRewardForTest<T extends TrainerItemId>(id: T): TrainerItemReward;
/**
 * Dynamically generate a {@linkcode Reward} from a given {@linkcode RewardConfiguration}.
 * @param specs - The {@linkcode RewardConfiguration} used to generate the reward
 * @returns The generated {@linkcode Reward}
 */
export function generateRewardForTest(specs: RewardConfiguration): Reward;
export function generateRewardForTest(specs: RewardConfiguration): Reward {
  const reward = createRewardFromSpecs(specs);
  if (!reward) {
    throw new Error(`Failed to generate reward for ${String(specs)}`);
  }
  return reward;
}
