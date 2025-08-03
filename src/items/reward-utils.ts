import { globalScene } from "#app/global-scene";
import { allRewards } from "#data/data-lists";
import type { HeldItemId } from "#enums/held-item-id";
import { getRewardCategory, RewardCategoryId, RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { RewardFunc, RewardPoolId } from "#types/rewards";
import { heldItemRarities } from "./held-item-default-tiers";
import {
  HeldItemReward,
  type PokemonMoveReward,
  type RememberMoveReward,
  type Reward,
  RewardGenerator,
  RewardOption,
  type TmReward,
  TrainerItemReward,
} from "./reward";
import { rewardRarities } from "./reward-defaults-tiers";
import { trainerItemRarities } from "./trainer-item-default-tiers";

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
 * Generates a Reward Option from a given id
 * @param rewardFunc
 * @param pregenArgs - can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateRewardOptionFromId(id: RewardPoolId, cost = 0, pregenArgs?: any[]): RewardOption | null {
  if (isHeldItemId(id)) {
    const reward = new HeldItemReward(id);
    const tier = heldItemRarities[id];
    return new RewardOption(reward, 0, tier, cost);
  }

  if (isTrainerItemId(id)) {
    const reward = new TrainerItemReward(id);
    const tier = trainerItemRarities[id];
    return new RewardOption(reward, 0, tier, cost);
  }

  const rewardFunc = allRewards[id];
  const reward = generateReward(rewardFunc, pregenArgs);
  if (reward) {
    const tier = rewardRarities[id];
    return new RewardOption(reward, 0, tier, cost);
  }
  return null;
}

export function getPlayerShopRewardOptionsForWave(waveIndex: number, baseCost: number): RewardOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      generateRewardOptionFromId(RewardId.POTION, baseCost * 0.2),
      generateRewardOptionFromId(RewardId.ETHER, baseCost * 0.4),
      generateRewardOptionFromId(RewardId.REVIVE, baseCost * 2),
    ],
    [
      generateRewardOptionFromId(RewardId.SUPER_POTION, baseCost * 0.45),
      generateRewardOptionFromId(RewardId.FULL_HEAL, baseCost),
    ],
    [generateRewardOptionFromId(RewardId.ELIXIR, baseCost), generateRewardOptionFromId(RewardId.MAX_ETHER, baseCost)],
    [
      generateRewardOptionFromId(RewardId.HYPER_POTION, baseCost * 0.8),
      generateRewardOptionFromId(RewardId.MAX_REVIVE, baseCost * 2.75),
      generateRewardOptionFromId(RewardId.MEMORY_MUSHROOM, baseCost * 4),
    ],
    [
      generateRewardOptionFromId(RewardId.MAX_POTION, baseCost * 1.5),
      generateRewardOptionFromId(RewardId.MAX_ELIXIR, baseCost * 2.5),
    ],
    [generateRewardOptionFromId(RewardId.FULL_RESTORE, baseCost * 2.25)],
    [generateRewardOptionFromId(RewardId.SACRED_ASH, baseCost * 10)],
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}

export function isRewardId(id: RewardPoolId): id is RewardId {
  return id > 0x2000;
}

export function isTrainerItemId(id: RewardPoolId): id is TrainerItemId {
  return id > 0x1000 && id < 0x2000;
}

export function isHeldItemId(id: RewardPoolId): id is HeldItemId {
  return id < 0x1000;
}
