import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { NatureWeightBoostParams } from "#types/held-item-parameter";

// TODO: Consider renaming this ("nature stat mult" or similar would perhaps be clearer)
export class NatureWeightBoosterHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER> {
  public override readonly effect = HeldItemEffect.NATURE_WEIGHT_BOOSTER;

  public override shouldApply({ multiplier }: NatureWeightBoostParams): boolean {
    return multiplier.value !== 1;
  }

  public override apply({ pokemon, multiplier }: NatureWeightBoostParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    multiplier.value += 0.1 * stackCount * Math.sign(multiplier.value);
    return true;
  }
}
