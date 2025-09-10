import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { TrainerItemPool, TrainerItemTieredPool } from "#items/trainer-item-data-types";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import { isNullOrUndefined, pickWeightedIndex } from "#utils/common";

export const enemyBuffTokenPool: TrainerItemTieredPool = {};

function getPoolWeights(pool: TrainerItemPool, manager: TrainerItemManager): number[] {
  return pool.map(p => {
    if (manager.isMaxStack(p.entry)) {
      return 0;
    }
    return p.weight;
  });
}

export function getNewTrainerItemFromPool(pool: TrainerItemPool, manager: TrainerItemManager): TrainerItemId {
  const weights = getPoolWeights(pool, manager);

  const pickedIndex = pickWeightedIndex(weights);
  if (isNullOrUndefined(pickedIndex)) {
    return 0;
  }
  const entry = pool[pickedIndex].entry;

  return entry as TrainerItemId;
}

export function assignEnemyBuffTokenForWave(tier: RarityTier) {
  let tierStackCount: number;
  switch (tier) {
    case RarityTier.ULTRA:
      tierStackCount = 5;
      break;
    case RarityTier.GREAT:
      tierStackCount = 3;
      break;
    default:
      tierStackCount = 1;
      break;
  }

  if (!enemyBuffTokenPool[tier]) {
    return;
  }

  const retryCount = 50;
  let candidate = getNewTrainerItemFromPool(enemyBuffTokenPool[tier], globalScene.enemyTrainerItems);
  let r = 0;
  while (
    ++r < retryCount
    && allTrainerItems[candidate].getMaxStackCount()
      < globalScene.enemyTrainerItems.getStack(candidate) + (r < 10 ? tierStackCount : 1)
  ) {
    candidate = getNewTrainerItemFromPool(enemyBuffTokenPool[tier], globalScene.enemyTrainerItems);
  }

  globalScene.enemyTrainerItems.add(candidate, tierStackCount);
}
