import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import { HeldItem, HeldItemEffect } from "../held-item";

export interface NatureWeightBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  multiplier: NumberHolder;
}

export class NatureWeightBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.NATURE_WEIGHT_BOOSTER];

  /**
   * Applies {@linkcode PokemonNatureWeightModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the nature weight to
   * @param multiplier {@linkcode NumberHolder} holding the nature weight
   * @returns `true` if multiplier was applied
   */
  apply(params: NatureWeightBoostParams): boolean {
    const pokemon = params.pokemon;
    const multiplier = params.multiplier;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (multiplier.value !== 1) {
      multiplier.value += 0.1 * stackCount * (multiplier.value > 1 ? 1 : -1);
      return true;
    }

    return false;
  }
}
