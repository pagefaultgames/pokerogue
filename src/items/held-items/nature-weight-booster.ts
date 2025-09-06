import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { NatureWeightBoostParams } from "#types/held-item-parameter";

export class NatureWeightBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER]> {
  public readonly effects = [HeldItemEffect.NATURE_WEIGHT_BOOSTER] as const;

  /**
   * Applies {@linkcode PokemonNatureWeightModifier}
   * @returns `true` if multiplier was applied
   */
  apply(
    _effect: typeof HeldItemEffect.NATURE_WEIGHT_BOOSTER,
    { pokemon, multiplier }: NatureWeightBoostParams,
  ): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (multiplier.value !== 1) {
      multiplier.value += 0.1 * stackCount * (multiplier.value > 1 ? 1 : -1);
      return true;
    }

    return false;
  }
}
