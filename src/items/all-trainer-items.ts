import { allTrainerItems } from "#data/data-lists";
import { getStatusEffectDescriptor } from "#data/status-effect";
import { Stat, type TempBattleStat } from "#enums/stat";
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
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";
import type { TrainerItemManager } from "./trainer-item-manager";

// #region Marker items

const markerItems = {
  [TrainerItemId.MAP]: new MarkerTrainerItem(TrainerItemId.MAP, 1),
  [TrainerItemId.IV_SCANNER]: new MarkerTrainerItem(TrainerItemId.IV_SCANNER, 1, "scanner"), // could also fix these filenames in assets
  [TrainerItemId.LOCK_CAPSULE]: new MarkerTrainerItem(TrainerItemId.LOCK_CAPSULE, 1),
  [TrainerItemId.MEGA_BRACELET]: new MarkerTrainerItem(TrainerItemId.MEGA_BRACELET, 1),
  [TrainerItemId.DYNAMAX_BAND]: new MarkerTrainerItem(TrainerItemId.DYNAMAX_BAND, 1),
  [TrainerItemId.TERA_ORB]: new MarkerTrainerItem(TrainerItemId.TERA_ORB, 1),

  [TrainerItemId.OVAL_CHARM]: new MarkerTrainerItem(TrainerItemId.OVAL_CHARM, 5, undefined, {
    options: { boostPercent: 10 },
  }),
  [TrainerItemId.EXP_SHARE]: new MarkerTrainerItem(TrainerItemId.EXP_SHARE, 5, undefined, {
    options: { sharePercent: 20 },
  }),
  [TrainerItemId.EXP_BALANCE]: new MarkerTrainerItem(TrainerItemId.EXP_BALANCE, 4),

  [TrainerItemId.GOLDEN_BUG_NET]: new MarkerTrainerItem(TrainerItemId.GOLDEN_BUG_NET, 1, "golden_net"),
} as const satisfies Partial<Readonly<Record<TrainerItemId, MarkerTrainerItem>>>;

// #endregion Marker items

// #region X items

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
          .description({
            options: {
              stat: i18next.t(`pokemonInfo:stat.${toCamelCase(Stat[stat])}`),
              boostPercent: 20,
              battleCount: 5,
            },
          })
          .lapsing()
          .build();
      } else {
        acc[trainerItemType] = new TrainerItemBuilder(trainerItemType, 5) //
          .attr(StatStageBoosterTrainerItemAttr, stat as Exclude<TempBattleStat, Stat.ACC>, 0.3)
          .description({
            options: {
              stat: i18next.t(`pokemonInfo:stat.${toCamelCase(Stat[stat])}`),
              boostPercent: 20,
              battleCount: 5,
            },
          })
          .lapsing()
          .build();
      }
      return acc;
    },
    {} as Mutable<XItemsType>,
  );

// #endregion X items

// #region Initialization

const trainerItems = {
  ...markerItems,

  ...xItems,
  [TrainerItemId.DIRE_HIT]: new TrainerItemBuilder(TrainerItemId.DIRE_HIT, 5) //
    .attr(CritBoosterTrainerItemAttr)
    .description({
      options: {
        stat: i18next.t("item:direHit.extra.raises"),
        stages: 1,
        battleCount: 5,
      },
    })
    .lapsing()
    .build(),

  [TrainerItemId.CANDY_JAR]: new TrainerItemBuilder(TrainerItemId.CANDY_JAR, 99) //
    .attr(LevelIncrementBoosterTrainerItemAttr)
    .description({ options: { levels: 1 } })
    .build(),
  [TrainerItemId.BERRY_POUCH]: new TrainerItemBuilder(TrainerItemId.BERRY_POUCH, 3) //
    .attr(PreserveBerryTrainerItemAttr)
    .description({ options: { chancePercent: 30 } })
    .build(),

  [TrainerItemId.HEALING_CHARM]: new TrainerItemBuilder(TrainerItemId.HEALING_CHARM, 5) //
    .attr(HealingBoosterTrainerItemAttr, 0.1)
    .description({ options: { boostPercent: 10 } })
    .build(),

  [TrainerItemId.EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.EXP_CHARM, 99) //
    .attr(ExpBoosterTrainerItemAttr, 25)
    .description({ options: { boostPercent: 25 } })
    .build(),
  [TrainerItemId.SUPER_EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.SUPER_EXP_CHARM, 30) //
    .attr(ExpBoosterTrainerItemAttr, 60)
    .description({ options: { boostPercent: 60 } })
    .build(),
  [TrainerItemId.GOLDEN_EXP_CHARM]: new TrainerItemBuilder(TrainerItemId.GOLDEN_EXP_CHARM, 10) //
    .attr(ExpBoosterTrainerItemAttr, 100)
    .description({ options: { boostPercent: 100 } })
    .build(),

  [TrainerItemId.AMULET_COIN]: new TrainerItemBuilder(TrainerItemId.AMULET_COIN, 5) //
    .attr(MoneyMultiplierTrainerItemAttr)
    .description({ options: { boostPercent: 20 } })
    .build(),
  [TrainerItemId.GOLDEN_POKEBALL]: new TrainerItemBuilder(TrainerItemId.GOLDEN_POKEBALL, 3) //
    .attr(ExtraRewardTrainerItemAttr)
    .description({ options: { count: 1 } })
    .iconName("pb_gold")
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
    .description({ options: { battleCount: 10 } })
    .lapsing()
    .build(),
  [TrainerItemId.SUPER_LURE]: new TrainerItemBuilder(TrainerItemId.SUPER_LURE, 15) //
    .attr(DoubleBattleChanceBoosterTrainerItemAttr)
    .description({ options: { battleCount: 15 } })
    .lapsing()
    .build(),
  [TrainerItemId.MAX_LURE]: new TrainerItemBuilder(TrainerItemId.MAX_LURE, 30) //
    .attr(DoubleBattleChanceBoosterTrainerItemAttr)
    .description({ options: { battleCount: 30 } })
    .lapsing()
    .build(),

  [TrainerItemId.ENEMY_DAMAGE_BOOSTER]: new TrainerItemBuilder(TrainerItemId.ENEMY_DAMAGE_BOOSTER, 999) //
    .attr(EnemyDamageBoosterTrainerItemAttr, 0.05)
    .description({ options: { boostPercent: 5 } })
    .iconName("wl_item_drop")
    .build(),
  [TrainerItemId.ENEMY_DAMAGE_REDUCTION]: new TrainerItemBuilder(TrainerItemId.ENEMY_DAMAGE_REDUCTION, 999) //
    .attr(EnemyDamageReducerTrainerItemAttr, 0.025)
    .description({ options: { reductionPercent: 2.5 } })
    .iconName("wl_guard_spec")
    .build(),
  [TrainerItemId.ENEMY_HEAL]: new TrainerItemBuilder(TrainerItemId.ENEMY_HEAL, 10) //
    .attr(EnemyTurnHealTrainerItemAttr, 2)
    .description({ options: { healPercent: 2 } })
    .iconName("wl_potion")
    .build(),
  [TrainerItemId.ENEMY_ATTACK_POISON_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_POISON_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.POISON, 0.05)
    .description({
      options: { chancePercent: 5, statusEffect: getStatusEffectDescriptor(StatusEffect.POISON) },
    })
    .iconName("wl_antidote")
    .build(),
  [TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.PARALYSIS, 0.025)
    .description({
      options: { chancePercent: 2.5, statusEffect: getStatusEffectDescriptor(StatusEffect.PARALYSIS) },
    })
    .iconName("wl_paralyze_heal")
    .build(),
  [TrainerItemId.ENEMY_ATTACK_BURN_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ATTACK_BURN_CHANCE, 10) //
    .attr(EnemyAttackStatusEffectChanceTrainerItemAttr, StatusEffect.BURN, 0.05)
    .description({
      options: { chancePercent: 5, statusEffect: getStatusEffectDescriptor(StatusEffect.BURN) },
    })
    .iconName("wl_burn_heal")
    .build(),
  [TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE]: new TrainerItemBuilder(
    TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE,
    10,
  )
    .attr(EnemyStatusEffectHealChanceTrainerItemAttr, 0.025)
    .description({ options: { chancePercent: 2.5 } })
    .iconName("wl_full_heal")
    .build(),
  [TrainerItemId.ENEMY_ENDURE_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_ENDURE_CHANCE, 10) //
    .attr(EnemyEndureChanceTrainerItemAttr)
    .description({ options: { chancePercent: 2 } })
    .build(),
  [TrainerItemId.ENEMY_FUSED_CHANCE]: new TrainerItemBuilder(TrainerItemId.ENEMY_FUSED_CHANCE, 10) //
    .attr(EnemyFusionChanceTrainerItemAttr)
    .description({ options: { chancePercent: 1 } })
    .build(),
} as const satisfies Readonly<Record<TrainerItemId, MarkerTrainerItem | TrainerItem>>;

/**
 * Resolved type of {@linkcode allTrainerItems}.
 * @privateRemarks
 * Declared in a separate file to avoid circular imports.
 */
export type AllTrainerItems = typeof trainerItems;

export function initTrainerItems() {
  Object.assign(allTrainerItems, trainerItems);
  Object.freeze(allTrainerItems);
}

// #endregion Initialization

export function applyTrainerItems<E extends TrainerItemEffect>(
  effect: E,
  manager: TrainerItemManager,
  params: TrainerItemEffectParamMap[E],
) {
  for (const itemId of manager.getItems()) {
    const trainerItem = allTrainerItems[itemId] as TrainerItem | MarkerTrainerItem;
    if ("effects" in trainerItem && trainerItem.hasEffect(effect)) {
      trainerItem.apply(effect, params, manager);
    }
  }
}
