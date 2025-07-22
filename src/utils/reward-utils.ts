import { getRewardCategory, RewardCategoryId, RewardId } from "#enums/reward-id";
import { RewardPoolType } from "#enums/reward-pool-type";
import type { PokemonMoveReward, RememberMoveReward, Reward, TmReward } from "#items/reward";
import { rewardPool } from "#items/reward-pools";
import type { RewardPool } from "#types/rewards";

export function getRewardPoolForType(poolType: RewardPoolType): RewardPool {
  switch (poolType) {
    case RewardPoolType.PLAYER:
      return rewardPool;
  }
}

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
