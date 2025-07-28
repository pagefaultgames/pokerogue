import { globalScene } from "#app/global-scene";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import { TrainerItemEffect } from "#items/trainer-item";
import { NumberHolder } from "#utils/common";

export interface DamageMoneyRewardParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The damage, used to calculate the money reward */
  damage: number;
}

export class DamageMoneyRewardHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.DAMAGE_MONEY_REWARD];

  /**
   * Applies {@linkcode DamageMoneyRewardModifier}
   * @returns always `true`
   */
  apply({ pokemon, damage }: DamageMoneyRewardParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const moneyAmount = new NumberHolder(Math.floor(damage * (0.5 * stackCount)));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    globalScene.addMoney(moneyAmount.value);

    return true;
  }
}
