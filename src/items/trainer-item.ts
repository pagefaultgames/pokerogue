import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { hslToHex, randSeedFloat, toDmgValue, type BooleanHolder, type NumberHolder } from "#app/utils/common";
import { TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import i18next from "i18next";
import type { TrainerItemManager } from "./trainer-item-manager";
import { addTextObject, TextStyle } from "#app/ui/text";
import { getStatKey, Stat, type TempBattleStat } from "#enums/stat";
import { BattlerTagType } from "#enums/battler-tag-type";
import { getStatusEffectDescriptor, getStatusEffectHealText } from "#app/data/status-effect";
import { getPokemonNameWithAffix } from "#app/messages";
import { StatusEffect } from "#enums/status-effect";

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

  ENEMY_DAMAGE_BOOSTER: 14,
  ENEMY_DAMAGE_REDUCER: 15,
  ENEMY_HEAL: 16,
  ENEMY_ATTACK_STATUS_CHANCE: 17,
  ENEMY_STATUS_HEAL_CHANCE: 18,
  ENEMY_ENDURE_CHANCE: 19,
  ENEMY_FUSED_CHANCE: 20,
} as const;

export type TRAINER_ITEM_EFFECT = (typeof TRAINER_ITEM_EFFECT)[keyof typeof TRAINER_ITEM_EFFECT];

export interface NUMBER_HOLDER_PARAMS {
  numberHolder: NumberHolder;
}

export interface BOOLEAN_HOLDER_PARAMS {
  booleanHolder: BooleanHolder;
}

export interface POKEMON_PARAMS {
  pokemon: Pokemon;
}

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
export class LevelIncrementBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.LEVEL_INCREMENT_BOOSTER];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const count = params.numberHolder;
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}

// Berry Pouch
export interface PRESERVE_BERRY_PARAMS {
  pokemon: Pokemon;
  doPreserve: BooleanHolder;
}

export class PreserveBerryTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.PRESERVE_BERRY];

  apply(manager: TrainerItemManager, params: PRESERVE_BERRY_PARAMS) {
    const stack = manager.getStack(this.type);
    params.doPreserve.value ||= params.pokemon.randBattleSeedInt(10) < stack * 3;
  }
}

// Healing Charm
export class HealingBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HEALING_BOOSTER];
  private multiplier: number;

  constructor(type: TrainerItemId, multiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.multiplier = multiplier;
  }

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const healingMultiplier = params.numberHolder;
    const stack = manager.getStack(this.type);
    healingMultiplier.value *= 1 + (this.multiplier - 1) * stack;
  }
}

// Exp Booster
export class ExpBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.EXP_BOOSTER];
  private boostPercent: number;

  constructor(type: TrainerItemId, boostPercent: number, stackCount?: number) {
    super(type, stackCount);

    this.boostPercent = boostPercent;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.ExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value = Math.floor(boost.value * (1 + stack * this.boostPercent * 0.01));
  }
}

export class MoneyMultiplierTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.MONEY_MULTIPLIER];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const moneyMultiplier = params.numberHolder;
    const stack = manager.getStack(this.type);
    moneyMultiplier.value += Math.floor(moneyMultiplier.value * 0.2 * stack);
  }
}

export class HiddenAbilityChanceBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HIDDEN_ABILITY_CHANCE_BOOSTER];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= Math.pow(2, -1 - stack);
  }
}

export class ShinyRateBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.SHINY_RATE_BOOSTER];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= Math.pow(2, 1 + stack);
  }
}

export class CriticalCatchChanceBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.CRITICAL_CATCH_CHANCE_BOOSTER];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= 1.5 + stack / 2;
  }
}

export class ExtraRewardTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.EXTRA_REWARD];

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const count = params.numberHolder;
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}

export class HealShopCostTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.HEAL_SHOP_COST];
  public readonly shopMultiplier: number;

  constructor(type: TrainerItemId, shopMultiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.shopMultiplier = shopMultiplier;
  }

  apply(_manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const moneyCost = params.numberHolder;
    moneyCost.value = Math.floor(moneyCost.value * this.shopMultiplier);
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

export class DoubleBattleChanceBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.DOUBLE_BATTLE_CHANCE_BOOSTER];

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.getMaxStackCount(),
    });
  }

  apply(_manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const doubleBattleChance = params.numberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value /= 4;
  }
}

interface TempStatToTrainerItemMap {
  [key: number]: TrainerItemId;
}

export const tempStatToTrainerItem: TempStatToTrainerItemMap = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
};

export class TempStatStageBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.TEMP_STAT_STAGE_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.percentage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const statLevel = params.numberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    const boost = this.stat !== Stat.ACC ? 0.3 : 1;
    statLevel.value += boost;
  }
}

export class TempCritBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.TEMP_CRIT_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS) {
    const critLevel = params.numberHolder;
    critLevel.value++;
  }
}

export class EnemyDamageBoosterTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_DAMAGE_BOOSTER];
  public damageBoost = 1.05;

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS): boolean {
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
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_DAMAGE_REDUCER];
  public damageReduction = 0.975;

  apply(manager: TrainerItemManager, params: NUMBER_HOLDER_PARAMS): boolean {
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
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_HEAL];
  public healPercent = 2;

  apply(manager: TrainerItemManager, params: POKEMON_PARAMS): boolean {
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
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_ATTACK_STATUS_CHANCE];
  public effect: StatusEffect;

  constructor(type: TrainerItemId, effect: StatusEffect, stackCount?: number) {
    super(type, stackCount);

    this.effect = effect;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EnemyAttackStatusEffectChanceModifierType.description", {
      chancePercent: this.getChance() * 100,
      statusEffect: getStatusEffectDescriptor(this.effect),
    });
  }

  apply(manager: TrainerItemManager, params: POKEMON_PARAMS): boolean {
    const stack = manager.getStack(this.type);
    const enemyPokemon = params.pokemon;
    const chance = this.getChance();

    if (randSeedFloat() <= chance * stack) {
      return enemyPokemon.trySetStatus(this.effect, true);
    }

    return false;
  }

  getChance(): number {
    return 0.025 * (this.effect === StatusEffect.BURN || this.effect === StatusEffect.POISON ? 2 : 1);
  }
}

export class EnemyStatusEffectHealChanceTrainerItem extends TrainerItem {
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_STATUS_HEAL_CHANCE];
  public chance = 0.025;

  apply(manager: TrainerItemManager, params: POKEMON_PARAMS): boolean {
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
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_ENDURE_CHANCE];
  public chance = 2;

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EnemyEndureChanceModifierType.description", {
      chancePercent: this.chance,
    });
  }

  apply(manager: TrainerItemManager, params: POKEMON_PARAMS): boolean {
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
  public effects: TRAINER_ITEM_EFFECT[] = [TRAINER_ITEM_EFFECT.ENEMY_FUSED_CHANCE];
  public chance = 0.01;

  apply(manager: TrainerItemManager, params: BOOLEAN_HOLDER_PARAMS) {
    const stack = manager.getStack(this.type);
    const isFusion = params.booleanHolder;
    if (randSeedFloat() > this.chance * stack) {
      return false;
    }
    isFusion.value = true;
  }
}
