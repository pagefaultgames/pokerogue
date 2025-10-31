import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { BatonParams } from "#types/held-item-parameter";

export class BatonHeldItem extends HeldItem<[typeof HeldItemEffect.BATON]> {
  public readonly effects = [HeldItemEffect.BATON] as const;

  /**
   * Applies {@linkcode SwitchEffectTransferModifier}
   */
  // TODO: This seems suspicious...
  apply(_effect: typeof HeldItemEffect.BATON, _params: BatonParams): void {}
}
