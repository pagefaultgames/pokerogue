import { allRewards } from "#data/data-lists";
import { RewardPoolType } from "#enums/reward-pool-type";
import type { Reward } from "#items/reward";
import { rewardPool } from "#items/reward-pools";
import type { RewardFunc, RewardPool } from "#types/rewards";

export function getRewardPoolForType(poolType: RewardPoolType): RewardPool {
  switch (poolType) {
    case RewardPoolType.PLAYER:
      return rewardPool;
  }
}

// TODO: document this
export function getReward(rewardFunc: RewardFunc): Reward {
  const reward = rewardFunc();
  if (!reward.id) {
    reward.id = Object.keys(allRewards).find(k => allRewards[k] === rewardFunc)!; // TODO: is this bang correct?
  }
  return reward;
}
