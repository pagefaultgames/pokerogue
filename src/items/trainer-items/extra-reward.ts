import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class ExtraRewardTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.EXTRA_REWARD> {
  public override readonly effect = TrainerItemEffect.EXTRA_REWARD;

  public override apply({ numberHolder: count }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}
