import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { ExpBoostParams } from "#types/held-item-parameter";

/**
 * Attribute used for items that boost the amount of experience gained from battles.
 * Used for Lucky and Golden Eggs.
 * @sealed
 */
export class ExpBoosterHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.EXP_BOOSTER> {
  public override readonly effect = HeldItemEffect.EXP_BOOSTER;
  /** The decimal boost to experience gained. */
  private readonly boost: number;

  constructor(boost: number) {
    super();
    this.boost = boost;
  }

  public override apply({ pokemon, expAmount }: ExpBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + stackCount * this.boost));
  }
}
