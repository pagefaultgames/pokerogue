import type { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import type { NumberHolder } from "#utils/common";

export interface FieldEffectParams {
  pokemon: Pokemon;
  /** The pokemon with the item */
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
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param fieldDuration {@linkcode NumberHolder} that stores the current field effect duration
   * @returns `true` if the field effect extension was applied successfully
   */
  apply(params: FieldEffectParams): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    params.fieldDuration.value += 2 * stackCount;
    return true;
  }
}
