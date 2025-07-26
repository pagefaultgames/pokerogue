import { globalScene } from "#app/global-scene";
import { RewardId } from "#enums/reward-id";
import type { RarityTier } from "#enums/reward-tier";
import { getHeldItemTier } from "./held-item-default-tiers";
import { getRewardTierFromPool } from "./init-reward-pools";
import { type HeldItemReward, type Reward, RewardGenerator, RewardOption, type TrainerItemReward } from "./reward";
import { getRewardTier } from "./reward-defaults-tiers";
import { getTrainerItemTier } from "./trainer-item-default-tiers";

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

/**
 * Finds the default rarity tier for a given reward. For unique held item or trainer item rewards,
 * falls back to the default rarity tier for the item.
 * @param reward The {@linkcode Reward} to determine the tier for.
 */
export function getRewardDefaultTier(reward: Reward): RarityTier {
  if (reward.id === RewardId.HELD_ITEM) {
    return getHeldItemTier((reward as HeldItemReward).itemId);
  }
  if (reward.id === RewardId.TRAINER_ITEM) {
    return getTrainerItemTier((reward as TrainerItemReward).itemId);
  }
  return getRewardTier(reward.id);
}
