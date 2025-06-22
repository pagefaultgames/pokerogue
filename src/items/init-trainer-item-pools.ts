import { RewardTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { enemyBuffTokenPool } from "./trainer-item-pool";

/**
 * Initialize the enemy buff modifier pool
 */
function initEnemyBuffTokenPool() {
  enemyBuffTokenPool[RewardTier.COMMON] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 9 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 9 },
    { entry: TrainerItemId.ENEMY_ATTACK_POISON_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_ATTACK_BURN_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 9 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 4 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 1 },
  ];
  enemyBuffTokenPool[RewardTier.GREAT] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 5 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 5 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 5 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 5 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 1 },
  ];
  enemyBuffTokenPool[RewardTier.ULTRA] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 10 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 10 },
    { entry: TrainerItemId.ENEMY_HEAL, weight: 10 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 10 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 10 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 5 },
  ];
  enemyBuffTokenPool[RewardTier.ROGUE] = [];
  enemyBuffTokenPool[RewardTier.MASTER] = [];
}

export function initTrainerItemPools() {
  // Default held item pools for specific scenarios
  initEnemyBuffTokenPool();
}
