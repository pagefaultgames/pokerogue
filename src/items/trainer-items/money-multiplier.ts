import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class MoneyMultiplierTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.MONEY_MULTIPLIER> {
  public override readonly effect = TrainerItemEffect.MONEY_MULTIPLIER;

  public override apply(params: NumberHolderParams, manager: TrainerItemManager): void {
    const moneyMultiplier = params.numberHolder;
    const stack = manager.getStack(this.type);
    moneyMultiplier.value += Math.floor(moneyMultiplier.value * 0.2 * stack);
  }
}
