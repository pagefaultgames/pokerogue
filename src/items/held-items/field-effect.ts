import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { FieldEffectParams } from "#types/held-item-parameter";

/**
 * Modifier used for held items, namely Mystical Rock, that extend the
 * duration of weather and terrain effects.
 * @see {@linkcode apply}
 */
export class FieldEffectHeldItem extends HeldItem<[typeof HeldItemEffect.FIELD_EFFECT]> {
  public readonly effects = [HeldItemEffect.FIELD_EFFECT] as const;

  /**
   * Provides two more turns per stack to any weather or terrain effect caused
   * by the holder.
   */
  apply(_effect: typeof HeldItemEffect.FIELD_EFFECT, { pokemon, fieldDuration }: FieldEffectParams): void {
    fieldDuration.value += 2 * pokemon.heldItemManager.getStack(this.type);
  }
}
