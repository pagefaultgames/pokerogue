import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { NumberHolder } from "#app/utils/common";
import { HeldItem, HELD_ITEM_EFFECT } from "../held-item";
import { TRAINER_ITEM_EFFECT } from "../trainer-item";

export interface DAMAGE_MONEY_REWARD_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  damage: number;
}

export class DamageMoneyRewardHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.DAMAGE_MONEY_REWARD];

  /**
   * Applies {@linkcode DamageMoneyRewardModifier}
   * @param pokemon The {@linkcode Pokemon} attacking
   * @param multiplier {@linkcode NumberHolder} holding the multiplier value
   * @returns always `true`
   */
  apply(params: DAMAGE_MONEY_REWARD_PARAMS): boolean {
    const pokemon = params.pokemon;
    const damage = params.damage;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const moneyAmount = new NumberHolder(Math.floor(damage * (0.5 * stackCount)));
    globalScene.applyPlayerItems(TRAINER_ITEM_EFFECT.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    globalScene.addMoney(moneyAmount.value);

    return true;
  }
}
