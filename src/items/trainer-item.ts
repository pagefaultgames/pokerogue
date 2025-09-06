import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectDescriptor, getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { getStatKey, Stat, type TempBattleStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TextStyle } from "#enums/text-style";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import { addTextObject } from "#ui/text";
import { hslToHex, randSeedFloat, toDmgValue } from "#utils/common";
import i18next from "i18next";
import type {
  BooleanHolderParams,
  NumberHolderParams,
  PokemonParams,
  PreserveBerryParams,
} from "./trainer-item-parameter";

export class TrainerItem {
  //  public pokemonId: number;
  public type: TrainerItemId;
  public maxStackCount: number;
  public isLapsing = false;
  public effects: TrainerItemEffect[] = [];

  //TODO: If this is actually never changed by any subclass, perhaps it should not be here
  public soundName = "se/restore";

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

export class DoubleBattleChanceBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.DOUBLE_BATTLE_CHANCE_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.getMaxStackCount(),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const doubleBattleChance = params.numberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value /= 4;
  }
}

type TempStatToTrainerItemMap = {
  [key in TempBattleStat]: TrainerItemId;
};

export const tempStatToTrainerItem: TempStatToTrainerItemMap = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
};

export class TempStatStageBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${TrainerItemNames[this.type]?.toLowerCase()}`);
  }

  get description(): string {
    console.log();
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.percentage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const statLevel = params.numberHolder;
    const boost = 0.3;
    statLevel.value += boost;
  }
}

export class TempAccuracyBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_ACCURACY_BOOSTER];

  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${TrainerItemNames[this.type]?.toLowerCase()}`);
  }

  get description(): string {
    console.log();
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(Stat.ACC)),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.percentage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const statLevel = params.numberHolder;
    const boost = 1;
    statLevel.value += boost;
  }
}

export class TempCritBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_CRIT_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const critLevel = params.numberHolder;
    critLevel.value++;
  }
}

export class EnemyDamageBoosterTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_DAMAGE_BOOSTER];
  public damageBoost = 1.05;

  get iconName(): string {
    return "wl_item_drop";
  }

  apply(manager: TrainerItemManager, params: NumberHolderParams): boolean {
    const stack = manager.getStack(this.type);
    const multiplier = params.numberHolder;

    multiplier.value = toDmgValue(multiplier.value * Math.pow(this.damageBoost, stack));

    return true;
  }

  getMaxStackCount(): number {
    return 999;
  }
}

export class EnemyDamageReducerTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_DAMAGE_REDUCER];
  public damageReduction = 0.975;

  get iconName(): string {
    return "wl_guard_spec";
  }

  apply(manager: TrainerItemManager, params: NumberHolderParams): boolean {
    const stack = manager.getStack(this.type);
    const multiplier = params.numberHolder;

    multiplier.value = toDmgValue(multiplier.value * Math.pow(this.damageReduction, stack));

    return true;
  }

  getMaxStackCount(): number {
    return globalScene.currentBattle.waveIndex < 2000 ? 99 : 999;
  }
}

export class EnemyTurnHealTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_HEAL];
  public healPercent = 2;

  get iconName(): string {
    return "wl_potion";
  }

  apply(manager: TrainerItemManager, params: PokemonParams): boolean {
    const stack = manager.getStack(this.type);
    const enemyPokemon = params.pokemon;

    if (!enemyPokemon.isFullHp()) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        enemyPokemon.getBattlerIndex(),
        Math.max(Math.floor(enemyPokemon.getMaxHp() / (100 / this.healPercent)) * stack, 1),
        i18next.t("modifier:enemyTurnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
        }),
        true,
        false,
        false,
        false,
        true,
      );
      return true;
    }

    return false;
  }
}

export class EnemyAttackStatusEffectChanceTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_ATTACK_STATUS_CHANCE];
  public effect: StatusEffect;

  constructor(type: TrainerItemId, effect: StatusEffect, stackCount?: number) {
    super(type, stackCount);

    this.effect = effect;
  }

  get iconName(): string {
    if (this.effect === StatusEffect.POISON) {
      return "wl_antidote";
    }
    if (this.effect === StatusEffect.PARALYSIS) {
      return "wl_paralyze_heal";
    }
    if (this.effect === StatusEffect.BURN) {
      return "wl_burn_heal";
    }
    return "";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.EnemyAttackStatusEffectChanceModifierType.description", {
      chancePercent: this.getChance() * 100,
      statusEffect: getStatusEffectDescriptor(this.effect),
    });
  }

  apply(manager: TrainerItemManager, params: PokemonParams): boolean {
    const stack = manager.getStack(this.type);
    const enemyPokemon = params.pokemon;
    const chance = this.getChance();

    if (randSeedFloat() <= chance * stack) {
      return enemyPokemon.trySetStatus(this.effect);
    }

    return false;
  }

  getChance(): number {
    return 0.025 * (this.effect === StatusEffect.BURN || this.effect === StatusEffect.POISON ? 2 : 1);
  }
}

export class EnemyStatusEffectHealChanceTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE];
  public chance = 0.025;

  get iconName(): string {
    return "wl_full_heal";
  }

  apply(manager: TrainerItemManager, params: PokemonParams): boolean {
    const stack = manager.getStack(this.type);
    const enemyPokemon = params.pokemon;

    if (!enemyPokemon.status || randSeedFloat() > this.chance * stack) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      getStatusEffectHealText(enemyPokemon.status.effect, getPokemonNameWithAffix(enemyPokemon)),
    );
    enemyPokemon.resetStatus();
    enemyPokemon.updateInfo();
    return true;
  }
}

export class EnemyEndureChanceTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_ENDURE_CHANCE];
  public chance = 2;

  get iconName(): string {
    return "wl_reset_urge";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.EnemyEndureChanceModifierType.description", {
      chancePercent: this.chance,
    });
  }

  apply(manager: TrainerItemManager, params: PokemonParams): boolean {
    const stack = manager.getStack(this.type);
    const target = params.pokemon;

    if (target.waveData.endured || target.randBattleSeedInt(100) >= this.chance * stack) {
      return false;
    }

    target.addTag(BattlerTagType.ENDURE_TOKEN, 1);

    target.waveData.endured = true;

    return true;
  }
}

export class EnemyFusionChanceTrainerItem extends TrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.ENEMY_FUSED_CHANCE];
  public chance = 0.01;

  get iconName(): string {
    return "wl_custom_spliced";
  }

  apply(manager: TrainerItemManager, params: BooleanHolderParams) {
    const stack = manager.getStack(this.type);
    const isFusion = params.booleanHolder;
    if (randSeedFloat() > this.chance * stack) {
      return false;
    }
    isFusion.value = true;
  }
}
