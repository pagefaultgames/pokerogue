import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { FieldEffectExtendParams } from "#types/held-item-parameter";

/**
 * Attribute for held items that extend the duration of weather and terrain effects.
 * Used for Mystical Rock.
 * @sealed
 */
export class FieldEffectExtendHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.FIELD_EFFECT_EXTEND> {
  public override readonly effect = HeldItemEffect.FIELD_EFFECT_EXTEND;

  private readonly turns: number;

  constructor(turns: number) {
    super();
    this.turns = turns;
  }

  /**
   * Provides two more turns per stack to any weather or terrain effect caused
   * by the holder.
   */
  public override apply({ pokemon, fieldEffectDuration }: FieldEffectExtendParams): void {
    fieldEffectDuration.value += this.turns * pokemon.heldItemManager.getStack(this.type);
  }
}
