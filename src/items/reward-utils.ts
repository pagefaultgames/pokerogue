import { globalScene } from "#app/global-scene";
import { RewardId } from "#enums/reward-id";
import { getRewardTierFromPool } from "./init-reward-pools";
import { type HeldItemReward, type Reward, RewardGenerator, RewardOption, type TrainerItemReward } from "./reward";

/**
 * Generates a Reward from a given function
 * @param rewardFunc
 * @param pregenArgs Can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateReward(rewardFunc: () => Reward, pregenArgs?: any[]): Reward | null {
  const reward = rewardFunc();
  return reward instanceof RewardGenerator ? reward.generateReward(globalScene.getPlayerParty(), pregenArgs) : reward;
}

/**
 * Generates a Reward Option from a given function
 * @param rewardFunc
 * @param pregenArgs - can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateRewardOption(rewardFunc: () => Reward, pregenArgs?: any[]): RewardOption | null {
  const reward = generateReward(rewardFunc, pregenArgs);
  if (reward) {
    const tier = getRewardTierFromPool(reward);
    return new RewardOption(reward, 0, tier);
  }
  return null;
}

/**This matches rewards based on their id. For example, it returns true when matching
 * rewards for two different types of berries, or two different TMs of the same rarity,
 * but it returns false when matching rewards for two TMs of different rarities.
 * For items that do not have a specific reward id, it directly compares their item ids.
 */
export function matchingRewards(a: Reward, b: Reward) {
  if (a.id === b.id) {
    return true;
  }
  if (a.id === RewardId.HELD_ITEM) {
    const itemIdA = (a as HeldItemReward).itemId;
    const itemIdB = (a as HeldItemReward).itemId;
    if (itemIdA === itemIdB) {
      return true;
    }
  }
  if (a.id === RewardId.TRAINER_ITEM) {
    const itemIdA = (a as TrainerItemReward).itemId;
    const itemIdB = (a as TrainerItemReward).itemId;
    if (itemIdA === itemIdB) {
      return true;
    }
  }
  return false;
}
