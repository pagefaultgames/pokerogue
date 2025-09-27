import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { AccuracyBoostParams } from "#types/held-item-parameter";

/**
 * @sealed
 */
export class AccuracyBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.ACCURACY_BOOSTER]> {
  public readonly effects = [HeldItemEffect.ACCURACY_BOOSTER] as const;
  private accuracyAmount: number;

  constructor(type: HeldItemId, maxStackCount: number, accuracy: number) {
    super(type, maxStackCount);
    this.accuracyAmount = accuracy;
  }

  apply(_effect: typeof HeldItemEffect.ACCURACY_BOOSTER, { pokemon, moveAccuracy }: AccuracyBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    moveAccuracy.value += this.accuracyAmount * stackCount;
  }
}
