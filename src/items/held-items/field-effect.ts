import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { NumberHolder } from "#utils/common";

export interface FieldEffectParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the field effect duration*/
  fieldDuration: NumberHolder;
}

/**
 * Modifier used for held items, namely Mystical Rock, that extend the
 * duration of weather and terrain effects.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class FieldEffectHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.FIELD_EFFECT];

  /**
   * Provides two more turns per stack to any weather or terrain effect caused
   * by the holder.
   * @returns always `true`
   */
  apply({ pokemon, fieldDuration }: FieldEffectParams): true {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    fieldDuration.value += 2 * stackCount;
    return true;
  }
}
