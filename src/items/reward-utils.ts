import { globalScene } from "#app/global-scene";
import { allRewards } from "#data/data-lists";
import { getRewardCategory, RewardCategoryId, RewardId } from "#enums/reward-id";
import type { RarityTier } from "#enums/reward-tier";
import type { RewardFunc } from "#types/rewards";
import { getHeldItemTier } from "./held-item-default-tiers";
import {
  type HeldItemReward,
  type PokemonMoveReward,
  type RememberMoveReward,
  type Reward,
  RewardGenerator,
  RewardOption,
  type TmReward,
  type TrainerItemReward,
} from "./reward";
import { getRewardTier } from "./reward-defaults-tiers";
import { getTrainerItemTier } from "./trainer-item-default-tiers";

export function isTmReward(reward: Reward): reward is TmReward {
  return getRewardCategory(reward.id) === RewardCategoryId.TM;
}

export function isMoveReward(reward: Reward): reward is PokemonMoveReward {
  const categoryId = getRewardCategory(reward.id);
  return categoryId === RewardCategoryId.ETHER || categoryId === RewardCategoryId.PP_UP;
}

export function isRememberMoveReward(reward: Reward): reward is RememberMoveReward {
  return reward.id === RewardId.MEMORY_MUSHROOM;
}

/**
 * Generates a Reward from a given function
 * @param rewardFunc
 * @param pregenArgs Can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateReward(rewardFunc: RewardFunc, pregenArgs?: any[]): Reward | null {
  const reward = rewardFunc();
  return reward instanceof RewardGenerator ? reward.generateReward(globalScene.getPlayerParty(), pregenArgs) : reward;
}

/**
 * Generates a Reward Option from a given function
 * @param rewardFunc
 * @param pregenArgs - can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateRewardOption(rewardFunc: RewardFunc, pregenArgs?: any[]): RewardOption | null {
  const reward = generateReward(rewardFunc, pregenArgs);
  if (reward) {
    const tier = getRewardDefaultTier(reward);
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

export function getPlayerShopRewardOptionsForWave(waveIndex: number, baseCost: number): RewardOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      new RewardOption(allRewards.POTION(), 0, baseCost * 0.2),
      new RewardOption(allRewards.ETHER(), 0, baseCost * 0.4),
      new RewardOption(allRewards.REVIVE(), 0, baseCost * 2),
    ],
    [
      new RewardOption(allRewards.SUPER_POTION(), 0, baseCost * 0.45),
      new RewardOption(allRewards.FULL_HEAL(), 0, baseCost),
    ],
    [new RewardOption(allRewards.ELIXIR(), 0, baseCost), new RewardOption(allRewards.MAX_ETHER(), 0, baseCost)],
    [
      new RewardOption(allRewards.HYPER_POTION(), 0, baseCost * 0.8),
      new RewardOption(allRewards.MAX_REVIVE(), 0, baseCost * 2.75),
      new RewardOption(allRewards.MEMORY_MUSHROOM(), 0, baseCost * 4),
    ],
    [
      new RewardOption(allRewards.MAX_POTION(), 0, baseCost * 1.5),
      new RewardOption(allRewards.MAX_ELIXIR(), 0, baseCost * 2.5),
    ],
    [new RewardOption(allRewards.FULL_RESTORE(), 0, baseCost * 2.25)],
    [new RewardOption(allRewards.SACRED_ASH(), 0, baseCost * 10)],
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}
