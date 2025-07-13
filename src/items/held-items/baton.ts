import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import { HeldItem, HeldItemEffect } from "../held-item";

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
  apply(): boolean {
    return true;
  }
}
