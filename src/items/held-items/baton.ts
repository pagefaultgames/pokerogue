import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import { HeldItem, HELD_ITEM_EFFECT } from "../held-item";

export interface BATON_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  expAmount: NumberHolder;
}

export class BatonHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.BATON];

  /**
   * Applies {@linkcode SwitchEffectTransferModifier}
   * @returns always `true`
   */
  apply(): boolean {
    return true;
  }
}
