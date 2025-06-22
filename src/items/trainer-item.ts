import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { hslToHex, type BooleanHolder, type NumberHolder } from "#app/utils/common";
import { TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import i18next from "i18next";
import type { TrainerItemManager } from "./trainer-item-manager";
import { addTextObject, TextStyle } from "#app/ui/text";
import { Stat, type TempBattleStat } from "#enums/stat";

export const TRAINER_ITEM_EFFECT = {
  LEVEL_INCREMENT_BOOSTER: 1,
  PRESERVE_BERRY: 2,
  HEALING_BOOSTER: 3,
  EXP_BOOSTER: 4,
  MONEY_MULTIPLIER: 5,
  HIDDEN_ABILITY_CHANCE_BOOSTER: 6,
  SHINY_RATE_BOOSTER: 7,
  CRITICAL_CATCH_CHANCE_BOOSTER: 8,
  EXTRA_REWARD: 9,

  HEAL_SHOP_COST: 10,
  DOUBLE_BATTLE_CHANCE_BOOSTER: 11,

  TEMP_STAT_STAGE_BOOSTER: 12,
  TEMP_CRIT_BOOSTER: 13,
} as const;

export type TRAINER_ITEM_EFFECT = (typeof TRAINER_ITEM_EFFECT)[keyof typeof TRAINER_ITEM_EFFECT];

export class TrainerItem {
  //  public pokemonId: number;
  public type: TrainerItemId;
  public maxStackCount: number;
  public isLapsing = false;

  //TODO: If this is actually never changed by any subclass, perhaps it should not be here
  public soundName = "se/restore";

  constructor(type: TrainerItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;
  }

  get name(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.name`) + " (new)";
  }

  get description(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.description`);
  }

  get iconName(): string {
    return `${TrainerItemNames[this.type]?.toLowerCase()}`;
  }

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createIcon(manager: TrainerItemManager): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(manager);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  getIconStackText(manager: TrainerItemManager): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1) {
      return null;
    }

    const stackCount = manager.getStack(this.type);
    const text = globalScene.add.bitmapText(10, 15, "item-count", stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (stackCount >= this.getMaxStackCount()) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0);

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

// Candy Jar
export interface LEVEL_INCREMENT_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  count: NumberHolder;
}

export class LevelIncrementBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.LEVEL_INCREMENT_BOOSTER];

  apply(params: LEVEL_INCREMENT_BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.count.value += stack;
  }
}

// Berry Pouch
export interface PRESERVE_BERRY_PARAMS {
  manager: TrainerItemManager;
  pokemon: Pokemon;
  doPreserve: BooleanHolder;
}

export class PreserveBerryTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.PRESERVE_BERRY];

  apply(params: PRESERVE_BERRY_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.doPreserve.value ||= params.pokemon.randBattleSeedInt(10) < stack * 3;
  }
}

// Healing Charm
export interface HEALING_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  healingMultiplier: NumberHolder;
}

export class HealingBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HEALING_BOOSTER];
  private multiplier: number;

  constructor(type: TrainerItemId, multiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.multiplier = multiplier;
  }

  apply(params: HEALING_BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.healingMultiplier.value *= 1 + (this.multiplier - 1) * stack;
  }
}

// Exp Booster
export interface EXP_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  boost: NumberHolder;
}

export class ExpBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.EXP_BOOSTER];
  private boostMultiplier: number;

  constructor(type: TrainerItemId, boostPercent: number, stackCount?: number) {
    super(type, stackCount);

    this.boostMultiplier = boostPercent * 0.01;
  }

  apply(params: EXP_BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.boost.value = Math.floor(params.boost.value * (1 + stack * this.boostMultiplier));
  }
}

export interface MONEY_MULTIPLIER_PARAMS {
  manager: TrainerItemManager;
  multiplier: NumberHolder;
}

export class MoneyMultiplierTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.MONEY_MULTIPLIER];

  apply(params: MONEY_MULTIPLIER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.multiplier.value += Math.floor(params.multiplier.value * 0.2 * stack);
  }
}

export interface BOOSTER_PARAMS {
  manager: TrainerItemManager;
  boost: NumberHolder;
}

export class HiddenAbilityChanceBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HIDDEN_ABILITY_CHANCE_BOOSTER];

  apply(params: BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.boost.value *= Math.pow(2, -1 - stack);
  }
}

export class ShinyRateBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.SHINY_RATE_BOOSTER];

  apply(params: BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.boost.value *= Math.pow(2, 1 + stack);
  }
}

export class CriticalCatchChanceBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.CRITICAL_CATCH_CHANCE_BOOSTER];

  apply(params: BOOSTER_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.boost.value *= 1.5 + stack / 2;
  }
}

export interface EXTRA_REWARD_PARAMS {
  manager: TrainerItemManager;
  count: NumberHolder;
}

export class ExtraRewardTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.EXTRA_REWARD];

  apply(params: EXTRA_REWARD_PARAMS) {
    const stack = params.manager.getStack(this.type);
    params.count.value *= stack;
  }
}

export interface HEAL_SHOP_COST_PARAMS {
  manager: TrainerItemManager;
  moneyCost: NumberHolder;
}

export class HealShopCostTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HEAL_SHOP_COST];
  public readonly shopMultiplier: number;

  constructor(type: TrainerItemId, shopMultiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.shopMultiplier = shopMultiplier;
  }

  apply(params: HEAL_SHOP_COST_PARAMS) {
    params.moneyCost.value = Math.floor(params.moneyCost.value * this.shopMultiplier);
  }
}

export class LapsingTrainerItem extends TrainerItem {
  isLapsing = true;

  createIcon(manager: TrainerItemManager): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    container.add(item);

    const battleCount = manager.getStack(this.type);

    // Linear interpolation on hue
    const hue = Math.floor(120 * (battleCount / this.getMaxStackCount()) + 5);

    // Generates the color hex code with a constant saturation and lightness but varying hue
    const typeHex = hslToHex(hue, 0.5, 0.9);
    const strokeHex = hslToHex(hue, 0.7, 0.3);

    const battleCountText = addTextObject(27, 0, battleCount.toString(), TextStyle.PARTY, {
      fontSize: "66px",
      color: typeHex,
    });
    battleCountText.setShadow(0, 0);
    battleCountText.setStroke(strokeHex, 16);
    battleCountText.setOrigin(1, 0);
    container.add(battleCountText);

    return container;
  }
}

export interface DOUBLE_BATTLE_CHANCE_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  doubleBattleChance: NumberHolder;
}

export class DoubleBattleChanceBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.DOUBLE_BATTLE_CHANCE_BOOSTER];

  apply(params: DOUBLE_BATTLE_CHANCE_BOOSTER_PARAMS) {
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    params.doubleBattleChance.value /= 4;
  }
}

interface TempStatToTrainerItemMap {
  [key: number]: TrainerItemId;
}

export const tempStatToTrainerItem: TempStatToTrainerItemMap = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SPATK,
  [Stat.SPDEF]: TrainerItemId.X_SPDEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
};

export interface TEMP_STAT_STAGE_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  statLevel: NumberHolder;
}

export class TempStatStageBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.TEMP_STAT_STAGE_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

  apply(params: TEMP_STAT_STAGE_BOOSTER_PARAMS) {
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    const boost = this.stat !== Stat.ACC ? 0.3 : 1;
    params.statLevel.value += boost;
  }
}

export interface TEMP_CRIT_BOOSTER_PARAMS {
  manager: TrainerItemManager;
  critLevel: NumberHolder;
}

export class TempCritBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.TEMP_CRIT_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

  apply(params: TEMP_CRIT_BOOSTER_PARAMS) {
    params.critLevel.value++;
  }
}
