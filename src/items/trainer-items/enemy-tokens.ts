import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectDescriptor, getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { TrainerItem } from "#items/trainer-item";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { BooleanHolderParams, NumberHolderParams, PokemonParams } from "#types/trainer-item-parameter";
import { randSeedFloat, toDmgValue } from "#utils/common";
import i18next from "i18next";

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
