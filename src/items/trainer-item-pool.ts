import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { TrainerItemPool, TrainerItemTieredPool } from "#types/trainer-item-data-types";
import { pickWeightedIndex } from "#utils/common";
import type { NonEmptyTuple } from "type-fest";

export const enemyBuffTokenPool: TrainerItemTieredPool = {};

export function getNewTrainerItemFromPool(pool: TrainerItemPool, manager: TrainerItemManager): TrainerItemId | null {
  const weights = getPoolWeights(pool, manager);

  const pickedIndex = pickWeightedIndex(weights);
  return pool[pickedIndex].entry;
}
function getPoolWeights(pool: TrainerItemPool, manager: TrainerItemManager): NonEmptyTuple<number> {
  return pool.map(({ entry, weight }) => (manager.isMaxStack(entry) ? 0 : weight));
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

  // TODO: Consider filtering the pool instead of retrying 50 times in a row?
  const retryCount = 50;
  let candidate = getNewTrainerItemFromPool(enemyBuffTokenPool[tier], globalScene.enemyTrainerItems);
  let r = 0;
  while (
    candidate !== null
    && ++r < retryCount
    && allTrainerItems[candidate].maxStackCount
      < globalScene.enemyTrainerItems.getStack(candidate) + (r < 10 ? tierStackCount : 1)
  ) {
    candidate = getNewTrainerItemFromPool(enemyBuffTokenPool[tier], globalScene.enemyTrainerItems);
  }

  if (candidate === null) {
    return;
  }

  globalScene.enemyTrainerItems.add(candidate, tierStackCount);
}
