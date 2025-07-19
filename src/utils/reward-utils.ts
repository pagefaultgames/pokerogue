import { RewardPoolType } from "#enums/reward-pool-type";
import { rewardPool } from "#items/reward-pools";
import type { RewardPool } from "#types/rewards";

export function getRewardPoolForType(poolType: RewardPoolType): RewardPool {
  switch (poolType) {
    case RewardPoolType.PLAYER:
      return rewardPool;
  }
}
