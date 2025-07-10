import type Pokemon from "#app/field/pokemon";
import { HeldItem, HELD_ITEM_EFFECT } from "#app/items/held-item";
import type { StatusEffect } from "#enums/status-effect";
import type { HeldItemId } from "#enums/held-item-id";

export interface TURN_END_STATUS_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class TurnEndStatusHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.TURN_END_STATUS];
  /** The status effect to be applied by the held item */
  public effect: StatusEffect;

  constructor(type: HeldItemId, maxStackCount = 1, effect: StatusEffect) {
    super(type, maxStackCount);

    this.effect = effect;
  }

  /**
   * Tries to inflicts the holder with the associated {@linkcode StatusEffect}.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @returns `true` if the status effect was applied successfully
   */
  apply(params: TURN_END_STATUS_PARAMS): boolean {
    return params.pokemon.trySetStatus(this.effect, true, undefined, undefined, this.name);
  }

  getStatusEffect(): StatusEffect {
    return this.effect;
  }
}
