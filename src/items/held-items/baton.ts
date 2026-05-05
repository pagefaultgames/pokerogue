import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { BatonParams } from "#types/held-item-parameter";

export class BatonHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.BATON> {
  public override readonly effect = HeldItemEffect.BATON;

  // TODO: This seems suspicious...
  public override apply(_params: BatonParams): void {}
}
