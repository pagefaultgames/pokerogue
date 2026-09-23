import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export class HealingBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.HEALING_BOOSTER> {
  public override readonly effect = TrainerItemEffect.HEALING_BOOSTER;
  // TODO: decide on % or multiplier and stop mixing the two for everything ffs
  private readonly multiplier: number;

  constructor(multiplier: number) {
    super();

    this.multiplier = multiplier;
  }

  public override apply({ numberHolder: healingMultiplier }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    healingMultiplier.value *= 1 + (this.multiplier - 1) * stack;
  }
}
