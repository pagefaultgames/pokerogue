import type { TempBattleStat } from "#enums/stat";
import { TrainerItemId } from "#enums/trainer-item-id";
import {
  type BOOSTER_PARAMS,
  CriticalCatchChanceBoosterTrainerItem,
  type DOUBLE_BATTLE_CHANCE_BOOSTER_PARAMS,
  DoubleBattleChanceBoosterTrainerItem,
  type EXP_BOOSTER_PARAMS,
  ExpBoosterTrainerItem,
  type EXTRA_REWARD_PARAMS,
  ExtraRewardTrainerItem,
  type HEAL_SHOP_COST_PARAMS,
  type HEALING_BOOSTER_PARAMS,
  HealingBoosterTrainerItem,
  HealShopCostTrainerItem,
  HiddenAbilityChanceBoosterTrainerItem,
  type LEVEL_INCREMENT_BOOSTER_PARAMS,
  LevelIncrementBoosterTrainerItem,
  type MONEY_MULTIPLIER_PARAMS,
  MoneyMultiplierTrainerItem,
  type PRESERVE_BERRY_PARAMS,
  PreserveBerryTrainerItem,
  ShinyRateBoosterTrainerItem,
  type TEMP_CRIT_BOOSTER_PARAMS,
  type TEMP_STAT_STAGE_BOOSTER_PARAMS,
  TempCritBoosterTrainerItem,
  TempStatStageBoosterTrainerItem,
  tempStatToTrainerItem,
  TRAINER_ITEM_EFFECT,
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
}

type APPLY_TRAINER_ITEMS_PARAMS = {
  [TRAINER_ITEM_EFFECT.LEVEL_INCREMENT_BOOSTER]: LEVEL_INCREMENT_BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.PRESERVE_BERRY]: PRESERVE_BERRY_PARAMS;
  [TRAINER_ITEM_EFFECT.HEALING_BOOSTER]: HEALING_BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.EXP_BOOSTER]: EXP_BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.MONEY_MULTIPLIER]: MONEY_MULTIPLIER_PARAMS;
  [TRAINER_ITEM_EFFECT.HIDDEN_ABILITY_CHANCE_BOOSTER]: BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.SHINY_RATE_BOOSTER]: BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.CRITICAL_CATCH_CHANCE_BOOSTER]: BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.EXTRA_REWARD]: EXTRA_REWARD_PARAMS;
  [TRAINER_ITEM_EFFECT.HEAL_SHOP_COST]: HEAL_SHOP_COST_PARAMS;
  [TRAINER_ITEM_EFFECT.DOUBLE_BATTLE_CHANCE_BOOSTER]: DOUBLE_BATTLE_CHANCE_BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.TEMP_STAT_STAGE_BOOSTER]: TEMP_STAT_STAGE_BOOSTER_PARAMS;
  [TRAINER_ITEM_EFFECT.TEMP_CRIT_BOOSTER]: TEMP_CRIT_BOOSTER_PARAMS;
};

export function applyTrainerItems<T extends TRAINER_ITEM_EFFECT>(effect: T, params: APPLY_TRAINER_ITEMS_PARAMS[T]) {
  const manager = params.manager;
  if (manager) {
    for (const item of Object.keys(manager.trainerItems)) {
      if (allTrainerItems[item].effects.includes(effect)) {
        allTrainerItems[item].apply(params);
      }
    }
  }
}
