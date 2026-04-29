import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class CriticalCatchChanceBoosterTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.CRITICAL_CATCH_CHANCE_BOOSTER
> {
  public override readonly effect = TrainerItemEffect.CRITICAL_CATCH_CHANCE_BOOSTER;

  public apply(params: NumberHolderParams, manager: TrainerItemManager): void {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= 1.5 + stack / 2;
  }
}
