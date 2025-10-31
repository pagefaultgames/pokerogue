import { globalScene } from "#app/global-scene";
import { HeldItemEffect } from "#enums/held-item-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { HeldItem } from "#items/held-item";
import type { DamageMoneyRewardParams } from "#types/held-item-parameter";
import { NumberHolder } from "#utils/common";

export class DamageMoneyRewardHeldItem extends HeldItem<[typeof HeldItemEffect.DAMAGE_MONEY_REWARD]> {
  public readonly effects = [HeldItemEffect.DAMAGE_MONEY_REWARD] as const;

  /**
   * Applies {@linkcode DamageMoneyRewardModifier}
   * @returns always `true`
   */
  apply(_effect: typeof HeldItemEffect.DAMAGE_MONEY_REWARD, { pokemon, damage }: DamageMoneyRewardParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const moneyAmount = new NumberHolder(Math.floor(damage * (0.5 * stackCount)));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    globalScene.addMoney(moneyAmount.value);
  }
}
