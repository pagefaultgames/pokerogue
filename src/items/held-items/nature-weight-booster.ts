import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { NatureWeightBoostParams } from "#types/held-item-parameter";

export class NatureWeightBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER]> {
  public readonly effects = [HeldItemEffect.NATURE_WEIGHT_BOOSTER] as const;

  public override shouldApply(
    _effect: typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER,
    { multiplier }: NatureWeightBoostParams,
  ): boolean {
    return multiplier.value !== 1;
  }

  public override apply(
    _effect: typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER,
    { pokemon, multiplier }: NatureWeightBoostParams,
  ): boolean {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    multiplier.value += 0.1 * stackCount * (multiplier.value > 1 ? 1 : -1);
    return true;
  }
}
