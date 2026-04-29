import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class ShinyRateBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.SHINY_RATE_BOOSTER> {
  public override readonly effect = TrainerItemEffect.SHINY_RATE_BOOSTER;

  public apply(params: NumberHolderParams, manager: TrainerItemManager): void {
    const boost = params.numberHolder;
    const stack = manager.getStack(this.type);
    boost.value *= Math.pow(2, 1 + stack);
  }
}
