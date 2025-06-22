import type { TempBattleStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import {
  CriticalCatchChanceBoosterTrainerItem,
  DoubleBattleChanceBoosterTrainerItem,
  EnemyAttackStatusEffectChanceTrainerItem,
  EnemyDamageBoosterTrainerItem,
  EnemyDamageReducerTrainerItem,
  EnemyEndureChanceTrainerItem,
  EnemyFusionChanceTrainerItem,
  EnemyStatusEffectHealChanceTrainerItem,
  EnemyTurnHealTrainerItem,
  ExpBoosterTrainerItem,
  ExtraRewardTrainerItem,
  HealingBoosterTrainerItem,
  HealShopCostTrainerItem,
  HiddenAbilityChanceBoosterTrainerItem,
  LevelIncrementBoosterTrainerItem,
  MoneyMultiplierTrainerItem,
  PreserveBerryTrainerItem,
  ShinyRateBoosterTrainerItem,
  TempCritBoosterTrainerItem,
  TempStatStageBoosterTrainerItem,
  tempStatToTrainerItem,
  TrainerItem,
} from "./trainer-item";

export const allTrainerItems = {};

export function initTrainerItems() {
  allTrainerItems[TrainerItemId.MAP] = new TrainerItem(TrainerItemId.MAP, 1);
  allTrainerItems[TrainerItemId.IV_SCANNER] = new TrainerItem(TrainerItemId.IV_SCANNER, 1);
  allTrainerItems[TrainerItemId.LOCK_CAPSULE] = new TrainerItem(TrainerItemId.LOCK_CAPSULE, 1);
  allTrainerItems[TrainerItemId.MEGA_EVOLUTION_ACCESS] = new TrainerItem(TrainerItemId.MEGA_EVOLUTION_ACCESS, 1);
  allTrainerItems[TrainerItemId.GIGANTAMAX_ACCESS] = new TrainerItem(TrainerItemId.GIGANTAMAX_ACCESS, 1);
  allTrainerItems[TrainerItemId.TERASTALLIZE_ACCESS] = new TrainerItem(TrainerItemId.TERASTALLIZE_ACCESS, 1);

  allTrainerItems[TrainerItemId.MULTIPLE_PARTICIPANT_EXP_BONUS] = new TrainerItem(
    TrainerItemId.MULTIPLE_PARTICIPANT_EXP_BONUS,
    5,
  );
  allTrainerItems[TrainerItemId.EXP_SHARE] = new TrainerItem(TrainerItemId.EXP_SHARE, 5);
  allTrainerItems[TrainerItemId.EXP_BALANCE] = new TrainerItem(TrainerItemId.EXP_BALANCE, 4);
  allTrainerItems[TrainerItemId.TERASTALLIZE_ACCESS] = new TrainerItem(TrainerItemId.TERASTALLIZE_ACCESS, 1);

  allTrainerItems[TrainerItemId.CANDY_JAR] = new LevelIncrementBoosterTrainerItem(TrainerItemId.CANDY_JAR, 99);
  allTrainerItems[TrainerItemId.BERRY_POUCH] = new PreserveBerryTrainerItem(TrainerItemId.BERRY_POUCH, 3);

  allTrainerItems[TrainerItemId.HEALING_CHARM] = new HealingBoosterTrainerItem(TrainerItemId.HEALING_CHARM, 1.1, 5);
  allTrainerItems[TrainerItemId.EXP_CHARM] = new ExpBoosterTrainerItem(TrainerItemId.EXP_CHARM, 25, 99);
  allTrainerItems[TrainerItemId.SUPER_EXP_CHARM] = new ExpBoosterTrainerItem(TrainerItemId.SUPER_EXP_CHARM, 60, 30);
  allTrainerItems[TrainerItemId.AMULET_COIN] = new MoneyMultiplierTrainerItem(TrainerItemId.AMULET_COIN, 5);

  allTrainerItems[TrainerItemId.ABILITY_CHARM] = new HiddenAbilityChanceBoosterTrainerItem(
    TrainerItemId.ABILITY_CHARM,
    4,
  );
  allTrainerItems[TrainerItemId.GOLDEN_POKEBALL] = new ExtraRewardTrainerItem(TrainerItemId.GOLDEN_POKEBALL, 3);
  allTrainerItems[TrainerItemId.SHINY_CHARM] = new ShinyRateBoosterTrainerItem(TrainerItemId.SHINY_CHARM, 4);
  allTrainerItems[TrainerItemId.CATCHING_CHARM] = new CriticalCatchChanceBoosterTrainerItem(
    TrainerItemId.CATCHING_CHARM,
    3,
  );

  allTrainerItems[TrainerItemId.BLACK_SLUDGE] = new HealShopCostTrainerItem(TrainerItemId.BLACK_SLUDGE, 2.5, 1);
  allTrainerItems[TrainerItemId.BUG_NET] = new TrainerItem(TrainerItemId.BUG_NET, 1);

  allTrainerItems[TrainerItemId.LURE] = new DoubleBattleChanceBoosterTrainerItem(TrainerItemId.LURE, 10);
  allTrainerItems[TrainerItemId.SUPER_LURE] = new DoubleBattleChanceBoosterTrainerItem(TrainerItemId.SUPER_LURE, 15);
  allTrainerItems[TrainerItemId.MAX_LURE] = new DoubleBattleChanceBoosterTrainerItem(TrainerItemId.MAX_LURE, 30);

  for (const [statKey, trainerItemType] of Object.entries(tempStatToTrainerItem)) {
    const stat = Number(statKey) as TempBattleStat;
    allTrainerItems[trainerItemType] = new TempStatStageBoosterTrainerItem(trainerItemType, stat, 5);
  }
  allTrainerItems[TrainerItemId.DIRE_HIT] = new TempCritBoosterTrainerItem(TrainerItemId.DIRE_HIT, 5);

  allTrainerItems[TrainerItemId.ENEMY_DAMAGE_BOOSTER] = new EnemyDamageBoosterTrainerItem(
    TrainerItemId.ENEMY_DAMAGE_BOOSTER,
  );
  allTrainerItems[TrainerItemId.ENEMY_DAMAGE_REDUCTION] = new EnemyDamageReducerTrainerItem(
    TrainerItemId.ENEMY_DAMAGE_REDUCTION,
  );
  allTrainerItems[TrainerItemId.ENEMY_HEAL] = new EnemyTurnHealTrainerItem(TrainerItemId.ENEMY_HEAL, 10);
  allTrainerItems[TrainerItemId.ENEMY_ATTACK_POISON_CHANCE] = new EnemyAttackStatusEffectChanceTrainerItem(
    TrainerItemId.ENEMY_ATTACK_POISON_CHANCE,
    StatusEffect.POISON,
    10,
  );
  allTrainerItems[TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE] = new EnemyAttackStatusEffectChanceTrainerItem(
    TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE,
    StatusEffect.PARALYSIS,
    10,
  );
  allTrainerItems[TrainerItemId.ENEMY_ATTACK_BURN_CHANCE] = new EnemyAttackStatusEffectChanceTrainerItem(
    TrainerItemId.ENEMY_ATTACK_BURN_CHANCE,
    StatusEffect.BURN,
    10,
  );
  allTrainerItems[TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE] = new EnemyStatusEffectHealChanceTrainerItem(
    TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE,
    10,
  );
  allTrainerItems[TrainerItemId.ENEMY_ENDURE_CHANCE] = new EnemyEndureChanceTrainerItem(
    TrainerItemId.ENEMY_ENDURE_CHANCE,
    10,
  );
  allTrainerItems[TrainerItemId.ENEMY_FUSED_CHANCE] = new EnemyFusionChanceTrainerItem(
    TrainerItemId.ENEMY_FUSED_CHANCE,
    10,
  );
}
