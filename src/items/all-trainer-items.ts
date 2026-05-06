import { allTrainerItems } from "#data/data-lists";
import type { Stat, TempBattleStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import { MarkerTrainerItem, type TrainerItem } from "#items/trainer-item";
import { TrainerItemBuilder } from "#items/trainer-item-builder";
import { CriticalCatchChanceBoosterTrainerItemAttr } from "#items/trainer-items/critical-catch-chance-booster";
import {
  EnemyAttackStatusEffectChanceTrainerItemAttr,
  EnemyDamageBoosterTrainerItemAttr,
  EnemyDamageReducerTrainerItemAttr,
  EnemyEndureChanceTrainerItemAttr,
  EnemyFusionChanceTrainerItemAttr,
  EnemyStatusEffectHealChanceTrainerItemAttr,
  EnemyTurnHealTrainerItemAttr,
} from "#items/trainer-items/enemy-tokens";
import { ExpBoosterTrainerItemAttr } from "#items/trainer-items/exp-booster";
import { ExtraRewardTrainerItemAttr } from "#items/trainer-items/extra-reward";
import { HealShopCostTrainerItemAttr } from "#items/trainer-items/heal-shop-cost";
import { HealingBoosterTrainerItemAttr } from "#items/trainer-items/healing-booster";
import { HiddenAbilityChanceBoosterTrainerItemAttr } from "#items/trainer-items/hidden-ability-chance-booster";
import { LevelIncrementBoosterTrainerItemAttr } from "#items/trainer-items/level-increment-booster";
import { DoubleBattleChanceBoosterTrainerItemAttr } from "#items/trainer-items/lure";
import { MoneyMultiplierTrainerItemAttr } from "#items/trainer-items/money-multiplier";
import { PreserveBerryTrainerItemAttr } from "#items/trainer-items/preserve-berry";
import { ShinyRateBoosterTrainerItemAttr } from "#items/trainer-items/shiny-rate-booster";
import {
  AccuracyBoosterTrainerItemAttr,
  CritBoosterTrainerItemAttr,
  StatStageBoosterTrainerItemAttr,
  tempStatToTrainerItem,
} from "#items/trainer-items/x-items";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";
import type { Mutable } from "#types/type-helpers";
import type { TrainerItemManager } from "./trainer-item-manager";

// #region Marker items
const markerItems = {
  [TrainerItemId.MAP]: new MarkerTrainerItem(TrainerItemId.MAP, 1),
  [TrainerItemId.IV_SCANNER]: new MarkerTrainerItem(TrainerItemId.IV_SCANNER, 1),
  [TrainerItemId.LOCK_CAPSULE]: new MarkerTrainerItem(TrainerItemId.LOCK_CAPSULE, 1),
  [TrainerItemId.MEGA_BRACELET]: new MarkerTrainerItem(TrainerItemId.MEGA_BRACELET, 1),
  [TrainerItemId.DYNAMAX_BAND]: new MarkerTrainerItem(TrainerItemId.DYNAMAX_BAND, 1),
  [TrainerItemId.TERA_ORB]: new MarkerTrainerItem(TrainerItemId.TERA_ORB, 1),

  [TrainerItemId.OVAL_CHARM]: new MarkerTrainerItem(TrainerItemId.OVAL_CHARM, 5),
  [TrainerItemId.EXP_SHARE]: new MarkerTrainerItem(TrainerItemId.EXP_SHARE, 5),
  [TrainerItemId.EXP_BALANCE]: new MarkerTrainerItem(TrainerItemId.EXP_BALANCE, 4),

  [TrainerItemId.GOLDEN_BUG_NET]: new MarkerTrainerItem(TrainerItemId.GOLDEN_BUG_NET, 1),
} as const satisfies Partial<Readonly<Record<TrainerItemId, MarkerTrainerItem>>>;

type XItemsType = {
  [k in keyof typeof tempStatToTrainerItem as (typeof tempStatToTrainerItem)[k]]: TrainerItem<
    k extends Stat.ACC ? AccuracyBoosterTrainerItemAttr : StatStageBoosterTrainerItemAttr
  >;
};

const xItems = Object.entries(tempStatToTrainerItem)
  .values()
  .reduce(
    (acc, [statKey, trainerItemType]) => {
      const stat = Number(statKey) satisfies TempBattleStat;
      if (trainerItemType === TrainerItemId.X_ACCURACY) {
        acc[trainerItemType] = new TrainerItemBuilder(TrainerItemId.X_ACCURACY, 5) //
          .attr(AccuracyBoosterTrainerItemAttr)
          .lapsing()
          .build();
      } else {
        acc[trainerItemType] = new TrainerItemBuilder(trainerItemType, 5) //
          .attr(StatStageBoosterTrainerItemAttr, stat as Exclude<TempBattleStat, Stat.ACC>, 0.3)
          .lapsing()
          .build();
      }
      return acc;
    },
    {} as Mutable<XItemsType>,
  );

const trainerItems = {
  ...markerItems,
  ...xItems,

  [TrainerItemId.CANDY_JAR]: new TrainerItemBuilder(TrainerItemId.CANDY_JAR, 99) //
    .attr(LevelIncrementBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.BERRY_POUCH]: new TrainerItemBuilder(TrainerItemId.BERRY_POUCH, 3) //
    .attr(PreserveBerryTrainerItemAttr)
    .build(),

  [TrainerItemId.HEALING_CHARM]: new TrainerItemBuilder(TrainerItemId.HEALING_CHARM, 5) //
    .attr(HealingBoosterTrainerItemAttr, 0.1)
    .build(),

  [TrainerItemId.EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.EXP_CHARM, 99) //
    .attr(ExpBoosterTrainerItemAttr, 25)
    .build(),
  [TrainerItemId.SUPER_EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.SUPER_EXP_CHARM, 30) //
    .attr(ExpBoosterTrainerItemAttr, 60)
    .build(),
  [TrainerItemId.GOLDEN_EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.GOLDEN_EXP_CHARM, 10) //
    .attr(ExpBoosterTrainerItemAttr, 100)
    .build(),

  [TrainerItemId.AMULET_COIN]: new TrainerItemBuilder(TrainerItemId.AMULET_COIN, 5) //
    .attr(MoneyMultiplierTrainerItemAttr)
    .build(),

  [TrainerItemId.GOLDEN_POKEBALL]: new TrainerItemBuilder(TrainerItemId.GOLDEN_POKEBALL, 3) //
    .attr(ExtraRewardTrainerItemAttr)
    .build(),

  [TrainerItemId.ABILITY_CHARM]: new TrainerItemBuilder(TrainerItemId.ABILITY_CHARM, 4) //
    .attr(HiddenAbilityChanceBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.SHINY_CHARM]: new TrainerItemBuilder(TrainerItemId.SHINY_CHARM, 4) //
    .attr(ShinyRateBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.CATCHING_CHARM]: new TrainerItemBuilder(TrainerItemId.CATCHING_CHARM, 3) //
    .attr(CriticalCatchChanceBoosterTrainerItemAttr)
    .build(),

  [TrainerItemId.BLACK_SLUDGE]: new TrainerItemBuilder(TrainerItemId.BLACK_SLUDGE, 1) //
    .attr(HealShopCostTrainerItemAttr, 2.5)
    .build(),

  [TrainerItemId.LURE]: new TrainerItemBuilder(TrainerItemId.LURE, 10) //
    .attr(DoubleBattleChanceBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.SUPER_LURE]: new TrainerItemBuilder(TrainerItemId.SUPER_LURE, 15) //
    .attr(DoubleBattleChanceBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.MAX_LURE]: new TrainerItemBuilder(TrainerItemId.MAX_LURE, 30) //
    .attr(DoubleBattleChanceBoosterTrainerItemAttr)
    .build(),

  [TrainerItemId.DIRE_HIT]: new TrainerItemBuilder(TrainerItemId.DIRE_HIT, 5) //
    .attr(CritBoosterTrainerItemAttr)
    .lapsing()
    .build(),

  // #region Tokens
  [TrainerItemId.ENEMY_DAMAGE_BOOSTER]: new TrainerItemBuilder(TrainerItemId.ENEMY_DAMAGE_BOOSTER) //
    .attr(EnemyDamageBoosterTrainerItemAttr)
    .build(),
  [TrainerItemId.ENEMY_DAMAGE_REDUCTION]: new TrainerItemBuilder(TrainerItemId.ENEMY_DAMAGE_REDUCTION) //
    .attr(EnemyDamageReducerTrainerItemAttr)
    .build(),
  [TrainerItemId.ENEMY_HEAL]: new TrainerItemBuilder(TrainerItemId.ENEMY_HEAL, 10) //
    .attr(EnemyTurnHealTrainerItemAttr)
    .build(),
  [TrainerItemId.ENEMY_ATTACK_POISON_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_POISON_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.POISON)
    .build(),
  [TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.PARALYSIS)
    .build(),
  [TrainerItemId.ENEMY_ATTACK_BURN_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_BURN_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.BURN)
    .build(),
  [TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE]: new TrainerItemBuilder(
    TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE,
    10,
  ) //
    .attr(EnemyStatusEffectHealChanceTrainerItemAttr)
    .build(),
  [TrainerItemId.ENEMY_ENDURE_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ENDURE_CHANCE, 10) //
    .attr(EnemyEndureChanceTrainerItemAttr)
    .build(),
  [TrainerItemId.ENEMY_FUSED_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_FUSED_CHANCE, 10) //
    .attr(EnemyFusionChanceTrainerItemAttr)
    .build(),

  // #endregion Tokens
};

export function initTrainerItems() {
  Object.assign(allTrainerItems, trainerItems);
  Object.freeze(allTrainerItems);
}

export function applyTrainerItems<T extends TrainerItemEffect>(
  effect: T,
  manager: TrainerItemManager,
  params: TrainerItemEffectParamMap[T],
) {
  if (manager) {
    for (const itemId of manager.getItems()) {
      const item = allTrainerItems[itemId];
      if (item.hasEffect(effect)) {
        item.apply(effect, params, manager);
      }
    }
  }
}
