import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { NumberHolder } from "#app/utils/common";
import { HeldItem, HeldItemEffect } from "../held-item";
import { TrainerItemEffect } from "../trainer-item";

export interface DamageMoneyRewardParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  damage: number;
}

export class DamageMoneyRewardHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.DAMAGE_MONEY_REWARD];

  /**
   * Applies {@linkcode DamageMoneyRewardModifier}
   * @param pokemon The {@linkcode Pokemon} attacking
   * @param multiplier {@linkcode NumberHolder} holding the multiplier value
   * @returns always `true`
   */
  apply(params: DamageMoneyRewardParams): boolean {
    const pokemon = params.pokemon;
    const damage = params.damage;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const moneyAmount = new NumberHolder(Math.floor(damage * (0.5 * stackCount)));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    globalScene.addMoney(moneyAmount.value);

    return true;
  }
}
