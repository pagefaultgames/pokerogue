import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { type TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams, PreserveBerryParams } from "#types/trainer-item-parameter";
import { addTextObject } from "#ui/text";
import { hslToHex } from "#utils/common";
import i18next from "i18next";

export class TrainerItem {
  //  public pokemonId: number;
  public type: TrainerItemId;
  public maxStackCount: number;
  public isLapsing = false;
  public effects: TrainerItemEffect[] = [];

  constructor(type: TrainerItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;
  }

  public get name(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.name`);
  }

  public get description(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.description`);
  }

  public get iconName(): string {
    return `${TrainerItemNames[this.type]?.toLowerCase()}`;
  }

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createIcon(stackCount: number): Phaser.GameObjects.Container {
    const container = globalScene.add.container();

    container.add(globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5));

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  getIconStackText(stackCount: number): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1 || stackCount < 1) {
      return null;
    }

    const text = globalScene.add
      .bitmapText(10, 15, "item-count", stackCount.toString(), 11)
      .setLetterSpacing(-0.5)
      .setOrigin(0);
    if (stackCount >= this.getMaxStackCount()) {
      text.setTint(0xf89890);
    }

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

export class LapsingTrainerItem extends TrainerItem {
  isLapsing = true;

  createIcon(battleCount: number): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    container.add(item);

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

// Candy Jar
export class LevelIncrementBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.LEVEL_INCREMENT_BOOSTER];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const count = params.numberHolder;
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}

// Berry Pouch
export class PreserveBerryTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.PRESERVE_BERRY];

  apply(manager: TrainerItemManager, params: PreserveBerryParams) {
    const stack = manager.getStack(this.type);
    params.doPreserve.value ||= params.pokemon.randBattleSeedInt(10) < stack * 3;
  }
}

// Healing Charm
export class HealingBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.HEALING_BOOSTER];
  private multiplier: number;

  constructor(type: TrainerItemId, multiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.multiplier = multiplier;
  }

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const healingMultiplier = params.numberHolder;
    const stack = manager.getStack(this.type);
    healingMultiplier.value *= 1 + (this.multiplier - 1) * stack;
  }
}

// Exp Booster
export class ExpBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.EXP_BOOSTER];
  private boostPercent: number;

  constructor(type: TrainerItemId, boostPercent: number, stackCount?: number) {
    super(type, stackCount);

    this.boostPercent = boostPercent;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.ExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value = Math.floor(boost.value * (1 + stack * this.boostPercent * 0.01));
  }
}

export class MoneyMultiplierTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.MONEY_MULTIPLIER];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const moneyMultiplier = params.numberHolder;
    const stack = manager.getStack(this.type);
    moneyMultiplier.value += Math.floor(moneyMultiplier.value * 0.2 * stack);
  }
}

export class HiddenAbilityChanceBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.HIDDEN_ABILITY_CHANCE_BOOSTER];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= Math.pow(2, -1 - stack);
  }
}

export class ShinyRateBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.SHINY_RATE_BOOSTER];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= Math.pow(2, 1 + stack);
  }
}

export class CriticalCatchChanceBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.CRITICAL_CATCH_CHANCE_BOOSTER];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= 1.5 + stack / 2;
  }
}

export class ExtraRewardTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.EXTRA_REWARD];

  apply(manager: TrainerItemManager, params: NumberHolderParams) {
    const count = params.numberHolder;
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}

export class HealShopCostTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.HEAL_SHOP_COST];
  public readonly shopMultiplier: number;

  constructor(type: TrainerItemId, shopMultiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.shopMultiplier = shopMultiplier;
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const moneyCost = params.numberHolder;
    moneyCost.value = Math.floor(moneyCost.value * this.shopMultiplier);
  }
}
