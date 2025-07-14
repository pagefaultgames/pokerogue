import type { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import type { NumberHolder } from "#utils/common";

export interface NatureWeightBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the multiplier */
  multiplier: NumberHolder;
}

export class NatureWeightBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.NATURE_WEIGHT_BOOSTER];

  /**
   * Applies {@linkcode PokemonNatureWeightModifier}
   * @returns `true` if multiplier was applied
   */
  apply({ pokemon, multiplier }: NatureWeightBoostParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (multiplier.value !== 1) {
      multiplier.value += 0.1 * stackCount * (multiplier.value > 1 ? 1 : -1);
      return true;
    }

    return false;
  }
}
