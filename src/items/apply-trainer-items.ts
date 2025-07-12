import { allTrainerItems } from "#app/data/data-lists";
import {
  type BooleanHolderParams,
  type NumberHolderParams,
  type PokemonParams,
  type PreserveBerryParams,
  TrainerItemEffect,
} from "./trainer-item";
import type { TrainerItemManager } from "./trainer-item-manager";

export type ApplyTrainerItemsParams = {
  [TrainerItemEffect.LEVEL_INCREMENT_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.PRESERVE_BERRY]: PreserveBerryParams;
  [TrainerItemEffect.HEALING_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.EXP_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.MONEY_MULTIPLIER]: NumberHolderParams;
  [TrainerItemEffect.HIDDEN_ABILITY_CHANCE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.SHINY_RATE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.CRITICAL_CATCH_CHANCE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.EXTRA_REWARD]: NumberHolderParams;
  [TrainerItemEffect.HEAL_SHOP_COST]: NumberHolderParams;
  [TrainerItemEffect.DOUBLE_BATTLE_CHANCE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.TEMP_ACCURACY_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.TEMP_CRIT_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.ENEMY_DAMAGE_BOOSTER]: NumberHolderParams;
  [TrainerItemEffect.ENEMY_DAMAGE_REDUCER]: NumberHolderParams;
  [TrainerItemEffect.ENEMY_HEAL]: PokemonParams;
  [TrainerItemEffect.ENEMY_ATTACK_STATUS_CHANCE]: PokemonParams;
  [TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE]: PokemonParams;
  [TrainerItemEffect.ENEMY_ENDURE_CHANCE]: PokemonParams;
  [TrainerItemEffect.ENEMY_FUSED_CHANCE]: BooleanHolderParams;
};

export function applyTrainerItems<T extends TrainerItemEffect>(
  effect: T,
  manager: TrainerItemManager,
  params: ApplyTrainerItemsParams[T],
) {
  if (manager) {
    for (const item of Object.keys(manager.trainerItems)) {
      if (allTrainerItems[item].effects.includes(effect)) {
        allTrainerItems[item].apply(manager, params);
      }
    }
  }
}
