import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { StatusEffect } from "#enums/status-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { BooleanHolderParams, NumberHolderParams, PokemonParams } from "#types/trainer-item-parameter";
import { randSeedFloat, toDmgValue } from "#utils/common";
import i18next from "i18next";

export class EnemyDamageBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_DAMAGE_BOOSTER> {
  public override readonly effect = TrainerItemEffect.ENEMY_DAMAGE_BOOSTER;
  /**
   * The extent to which the attached item should increase outbound damage, expressed as a decimal.
   * @remarks
   * Multiple stacks of the same item will each **multiplicatively** increase damage dealt,
   * resulting in an overall multiplier of `(1+damageBoost)^stacks`.
   */
  private readonly damageBoost: number;

  /**
   * @param damageBoost - The extent to which this item should increase outbound damage, expressed as a decimal.
   *
   */
  constructor(damageBoost: number) {
    super();
    this.damageBoost = damageBoost;
  }
  public override apply({ numberHolder: damageDealt }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    const multiplier = Math.pow(1 + this.damageBoost, stack);
    damageDealt.value = toDmgValue(damageDealt.value * multiplier);
  }
}

export class EnemyDamageReducerTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_DAMAGE_REDUCER> {
  public override readonly effect = TrainerItemEffect.ENEMY_DAMAGE_REDUCER;
  /**
   * The extent to which each stack of this item should reduce incoming damage, expressed as a decimal.
   * @remarks
   * Multiple stacks of the same item will each **multiplicatively** decrease damage taken,
   * resulting in an overall multiplier of `(1-damageReduction)^stacks`.
   */
  private readonly damageReduction: number;

  constructor(damageReduction: number) {
    super();
    this.damageReduction = damageReduction;
  }

  public override apply({ numberHolder: damageTaken }: NumberHolderParams, manager: TrainerItemManager): void {
    const stackCount = manager.getStack(this.type);

    const multiplier = Math.pow(1 - this.damageReduction, stackCount);
    damageTaken.value = toDmgValue(damageTaken.value * multiplier);
  }
}

export class EnemyTurnHealTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_HEAL> {
  public override readonly effect = TrainerItemEffect.ENEMY_HEAL;
  /**
   * The portion of the holder's maximum HP the attached item should heal each turn, expressed as a decimal. \
   * Multiple stacks of the same item will each add to the amount healed,
   * resulting in an overall heal percentage of `healPercent*stacks`.
   * Note that this effect can never heal an enemy to full HP.
   */
  private readonly healPercent: number;

  /**
   * @param healPercent - The portion of the holder's maximum HP the attached item should heal each turn, expressed as a decimal.
   * Multiple stacks of the same item will each add to the amount healed,
   * resulting in an overall heal percentage of `healPercent*stacks`.
   */
  constructor(healPercent: number) {
    super();
    this.healPercent = healPercent;
  }

  public override apply({ pokemon: enemyPokemon }: PokemonParams, manager: TrainerItemManager): void {
    if (enemyPokemon.isFullHp()) {
      return;
    }

    const stack = manager.getStack(this.type);

    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      enemyPokemon.getBattlerIndex(),
      // TODO: Do we need to round this?
      Math.max(Math.floor(enemyPokemon.getMaxHp() * this.healPercent * stack), 1),
      i18next.t("itemApply:enemyTurnHealApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
      }),
      true,
      false,
      false,
      false,
      true,
    );
  }
}

export class EnemyAttackStatusEffectChanceTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.ENEMY_ATTACK_STATUS_CHANCE
> {
  public override readonly effect = TrainerItemEffect.ENEMY_ATTACK_STATUS_CHANCE;
  public statusEffect: StatusEffect;
  /** The chance of this token triggering per stack, expressed as a decimal. */
  private readonly chance: number;

  constructor(statusEffect: StatusEffect, chance: number) {
    super();

    this.statusEffect = statusEffect;
    this.chance = chance;
  }

  public override apply({ pokemon: enemyPokemon }: PokemonParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    if (randSeedFloat() <= this.chance * stack) {
      enemyPokemon.trySetStatus(this.statusEffect);
    }
  }
}

export class EnemyStatusEffectHealChanceTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE
> {
  public override readonly effect = TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE;
  private readonly chance: number;

  constructor(chance: number) {
    super();

    this.chance = chance;
  }

  public override apply({ pokemon: enemyPokemon }: PokemonParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);

    if (!enemyPokemon.status || randSeedFloat() > this.chance * stack) {
      return;
    }

    globalScene.phaseManager.queueMessage(
      getStatusEffectHealText(enemyPokemon.status.effect, getPokemonNameWithAffix(enemyPokemon)),
    );
    enemyPokemon.resetStatus();
    enemyPokemon.updateInfo();
  }
}

export class EnemyEndureChanceTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_ENDURE_CHANCE> {
  public override readonly effect = TrainerItemEffect.ENEMY_ENDURE_CHANCE;
  // TODO: MAKE THIS CONSISTENT PLEASEEEEEE
  public chance = 2;

  get iconName(): string {
    return "wl_reset_urge";
  }

  public override apply({ pokemon: target }: PokemonParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);

    if (target.waveData.endured || target.randBattleSeedInt(100) >= this.chance * stack) {
      return;
    }

    target.addTag(BattlerTagType.ENDURE_TOKEN, 1);

    target.waveData.endured = true;
  }
}

export class EnemyFusionChanceTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_FUSED_CHANCE> {
  public override readonly effect = TrainerItemEffect.ENEMY_FUSED_CHANCE;
  public chance = 0.01;

  get iconName(): string {
    return "wl_custom_spliced";
  }

  public override apply({ booleanHolder: isFusion }: BooleanHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    if (randSeedFloat() <= this.chance * stack) {
      isFusion.value = true;
    }
  }
}
