import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { FieldEffectParams } from "#types/held-item-parameter";

/**
 * Attribute for held items that extend the duration of weather and terrain effects.
 * Used for Mystical Rock.
 * @sealed
 */
// TODO: Rename this to be more descriptive
export class FieldEffectHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.FIELD_EFFECT> {
  public override readonly effect = HeldItemEffect.FIELD_EFFECT;

  /**
   * Provides two more turns per stack to any weather or terrain effect caused
   * by the holder.
   */
  public override apply({ pokemon, fieldDuration }: FieldEffectParams): void {
    fieldDuration.value += 2 * pokemon.heldItemManager.getStack(this.type);
  }
}
