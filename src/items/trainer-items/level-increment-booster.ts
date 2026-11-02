import { TrainerItemEffect } from "#enums/trainer-item-effect";
// Candy Jar
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class LevelIncrementBoosterTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.LEVEL_INCREMENT_BOOSTER
> {
  public override readonly effect = TrainerItemEffect.LEVEL_INCREMENT_BOOSTER;

  public override apply({ numberHolder: count }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    count.value += stack;
  }
}
