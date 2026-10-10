import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class HealShopCostTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.HEAL_SHOP_COST> {
  public override readonly effect = TrainerItemEffect.HEAL_SHOP_COST;
  public readonly shopMultiplier: number;

  constructor(shopMultiplier: number) {
    super();

    this.shopMultiplier = shopMultiplier;
  }

  public override apply({ numberHolder: moneyCost }: NumberHolderParams): void {
    moneyCost.value = Math.floor(moneyCost.value * this.shopMultiplier);
  }
}
