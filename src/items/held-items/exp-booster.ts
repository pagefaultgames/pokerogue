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
  /** The percentage boost to experience gained. */
  // TODO: This should arguably be stored as a decimal instead of % for consistency with other similar effects
  private readonly boostPercent: number;

  constructor(boostPercent: number) {
    super();
    this.boostPercent = boostPercent;
  }

  public override apply({ pokemon, expAmount }: ExpBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + (stackCount * this.boostPercent) / 100));
  }
}
