import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { NumberHolder } from "#utils/common";

export interface BatonParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  expAmount: NumberHolder;
}

export class BatonHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.BATON];

  /**
   * Applies {@linkcode SwitchEffectTransferModifier}
   * @returns always `true`
   */
  apply(): true {
    return true;
  }
}
