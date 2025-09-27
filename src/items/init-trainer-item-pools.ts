import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { enemyBuffTokenPool } from "#items/trainer-item-pool";

/**
 * Initialize the enemy buff modifier pool
 */
function initEnemyBuffTokenPool() {
  enemyBuffTokenPool[RarityTier.COMMON] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 9 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 9 },
    { entry: TrainerItemId.ENEMY_ATTACK_POISON_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_ATTACK_BURN_CHANCE, weight: 3 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 9 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 4 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 1 },
  ];
  enemyBuffTokenPool[RarityTier.GREAT] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 5 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 5 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 5 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 5 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 1 },
  ];
  enemyBuffTokenPool[RarityTier.ULTRA] = [
    { entry: TrainerItemId.ENEMY_DAMAGE_BOOSTER, weight: 10 },
    { entry: TrainerItemId.ENEMY_DAMAGE_REDUCTION, weight: 10 },
    { entry: TrainerItemId.ENEMY_HEAL, weight: 10 },
    { entry: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE, weight: 10 },
    { entry: TrainerItemId.ENEMY_ENDURE_CHANCE, weight: 10 },
    { entry: TrainerItemId.ENEMY_FUSED_CHANCE, weight: 5 },
  ];
  enemyBuffTokenPool[RarityTier.ROGUE] = [];
  enemyBuffTokenPool[RarityTier.MASTER] = [];
}

export function initTrainerItemPools() {
  // Default held item pools for specific scenarios
  initEnemyBuffTokenPool();
}
