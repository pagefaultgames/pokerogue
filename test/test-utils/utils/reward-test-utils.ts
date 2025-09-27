import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { allRewards, type allRewardsType } from "#items/all-rewards";
import { HeldItemReward, type Reward, RewardGenerator, TrainerItemReward } from "#items/reward";
import { isHeldItemId, isTrainerItemId } from "#items/reward-utils";
import type { RewardPoolId, RewardSpecs } from "#types/rewards";

// Type used to pares allRewards and convert generators into their return values
type allRewardsRewardType = {
  [k in keyof allRewardsType]: allRewardsType[k] extends RewardGenerator
    ? ReturnType<allRewardsType[k]["generateReward"]>
    : allRewardsType[k];
};

/**
 * Dynamically generate a {@linkcode Reward} from a given RewardSpecs.
 * @param specs - The {@linkcode RewardSpecs} used to generate the reward
 * @returns The generated {@linkcode Reward}, or `null` if no reward could be generated
 * @todo Remove `null` from signature eventually
 * @example
 * ```ts
 * const reward = generateRewardForTest({id: RewardId.BERRY, args: BerryType.SITRUS});
 * ```
 */
export function generateRewardForTest<T extends RewardId>(specs: RewardSpecs<T>): allRewardsRewardType[T] | null;
/**
 * Dynamically generate a {@linkcode Reward} from a given HeldItemId.
 * @param id - The {@linkcode HeldItemId | ID} of the Held item to generate
 * @returns The generated {@linkcode HeldItemReward}, or `null` if no reward could be generated
 * @todo Remove `null` from signature eventually
 * @example
 * ```ts
 * const reward = generateRewardForTest(HeldItemId.REVIVER_SEED);
 * ```
 */
export function generateRewardForTest<T extends HeldItemId>(id: RewardSpecs<T>): HeldItemReward | null;
/**
 * Dynamically generate a {@linkcode Reward} from a given TrainerItemId.
 * @param id - The {@linkcode TrainerItemId | ID} of the Trainer item to generate
 * @returns The generated {@linkcode TrainerItemReward}, or `null` if no reward could be generated
 * @todo Remove `null` from signature eventually
 * @example
 * ```ts
 * const reward = generateRewardForTest(TrainerItemId.HEALING_CHARM);
 * ```
 */
export function generateRewardForTest<T extends TrainerItemId>(specs: RewardSpecs<T>): TrainerItemReward | null;
export function generateRewardForTest(specs: RewardSpecs): Reward | null {
  // Destructure specs into individual parameters
  const pregenArgs = typeof specs === "object" ? specs.args : undefined;
  const id: RewardPoolId = typeof specs === "object" ? specs.id : specs;

  if (isHeldItemId(id)) {
    return new HeldItemReward(id);
  }

  if (isTrainerItemId(id)) {
    return new TrainerItemReward(id);
  }

  const rewardFunc = allRewards[id];
  // @ts-expect-error - We enforce call safety using overloads
  return rewardFunc instanceof RewardGenerator ? rewardFunc.generateReward(pregenArgs) : rewardFunc;
}
