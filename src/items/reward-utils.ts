import { globalScene } from "#app/global-scene";
import { getRewardTierFromPool } from "./init-reward-pools";
import { type Reward, RewardGenerator, RewardOption } from "./reward";

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
