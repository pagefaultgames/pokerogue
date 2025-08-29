import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { BatonParams } from "#items/held-item-parameter";

export class BatonHeldItem extends HeldItem<[typeof HeldItemEffect.BATON]> {
  public readonly effects = [HeldItemEffect.BATON] as const;

  /**
   * Applies {@linkcode SwitchEffectTransferModifier}
   * @returns always `true`
   */
  apply(_effect: typeof HeldItemEffect.BATON, { pokemon }: BatonParams): true {
    return true;
  }
}
