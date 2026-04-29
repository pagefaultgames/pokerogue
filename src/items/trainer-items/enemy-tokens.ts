import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectDescriptor, getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { BooleanHolderParams, NumberHolderParams, PokemonParams } from "#types/trainer-item-parameter";
import { randSeedFloat, toDmgValue } from "#utils/common";
import i18next from "i18next";

export class EnemyDamageBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_DAMAGE_BOOSTER> {
  public override readonly effect = TrainerItemEffect.ENEMY_DAMAGE_BOOSTER;
  public damageBoost = 1.05;

  get iconName(): string {
    return "wl_item_drop";
  }

  public override apply({ numberHolder: multiplier }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    multiplier.value = toDmgValue(multiplier.value * Math.pow(this.damageBoost, stack));
  }

  getMaxStackCount(): number {
    return 999;
  }
}

export class EnemyDamageReducerTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_DAMAGE_REDUCER> {
  public override readonly effect = TrainerItemEffect.ENEMY_DAMAGE_REDUCER;
  public damageReduction = 0.975;

  get iconName(): string {
    return "wl_guard_spec";
  }

  public override apply({ numberHolder: multiplier }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);

    multiplier.value = toDmgValue(multiplier.value * Math.pow(this.damageReduction, stack));
  }

  getMaxStackCount(): number {
    return globalScene.currentBattle.waveIndex < 2000 ? 99 : 999;
  }
}

export class EnemyTurnHealTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.ENEMY_HEAL> {
  public override readonly effect = TrainerItemEffect.ENEMY_HEAL;
  public healPercent = 2;

  get iconName(): string {
    return "wl_potion";
  }

  public override apply({ pokemon: enemyPokemon }: PokemonParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);

    if (enemyPokemon.isFullHp()) {
      return;
    }
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      enemyPokemon.getBattlerIndex(),
      Math.max(Math.floor((enemyPokemon.getMaxHp() * this.healPercent * stack) / 100), 1),
      i18next.t("modifier:enemyTurnHealApply", {
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

  constructor(statusEffect: StatusEffect) {
    super();

    this.statusEffect = statusEffect;
  }

  get iconName(): string {
    if (this.statusEffect === StatusEffect.POISON) {
      return "wl_antidote";
    }
    if (this.statusEffect === StatusEffect.PARALYSIS) {
      return "wl_paralyze_heal";
    }
    if (this.statusEffect === StatusEffect.BURN) {
      return "wl_burn_heal";
    }
    return "";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.EnemyAttackStatusEffectChanceModifierType.description", {
      chancePercent: this.getChance() * 100,
      statusEffect: getStatusEffectDescriptor(this.statusEffect),
    });
  }

  public override apply({ pokemon: enemyPokemon }: PokemonParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    const chance = this.getChance();

    if (randSeedFloat() <= chance * stack) {
      enemyPokemon.trySetStatus(this.statusEffect);
    }
  }

  getChance(): number {
    return 0.025 * (this.statusEffect === StatusEffect.BURN || this.statusEffect === StatusEffect.POISON ? 2 : 1);
  }
}

export class EnemyStatusEffectHealChanceTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE
> {
  public override readonly effect = TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE;
  public chance = 0.025;

  get iconName(): string {
    return "wl_full_heal";
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

  get description(): string {
    return i18next.t("modifierType:ModifierType.EnemyEndureChanceModifierType.description", {
      chancePercent: this.chance,
    });
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
