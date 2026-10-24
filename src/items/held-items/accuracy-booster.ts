import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { AccuracyBoostParams } from "#types/held-item-parameter";

/**
 * Attribute used for items that boost move accuracy by a flat amount.
 * @sealed
 */
export class AccuracyBoosterHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.ACCURACY_BOOSTER> {
  public override readonly effect = HeldItemEffect.ACCURACY_BOOSTER;
  private readonly accuracyAmount: number;

  constructor(accuracyAmount: number) {
    super();
    this.accuracyAmount = accuracyAmount;
  }

  public override apply({ pokemon, moveAccuracy }: AccuracyBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    moveAccuracy.value += this.accuracyAmount * stackCount;
  }
}
