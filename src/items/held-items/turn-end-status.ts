import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { StatusEffect } from "#enums/status-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";

export interface TurnEndStatusParams {
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
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_STATUS];
  /** The status effect to be applied by the held item */
  public effect: StatusEffect;

  constructor(type: HeldItemId, maxStackCount: number, effect: StatusEffect) {
    super(type, maxStackCount);

    this.effect = effect;
  }

  /**
   * Tries to inflicts the holder with the associated {@linkcode StatusEffect}.
   * @returns `true` if the status effect was applied successfully
   */
  apply({ pokemon }: TurnEndStatusParams): boolean {
    return pokemon.trySetStatus(this.effect, true, pokemon, undefined, this.name);
  }

  getStatusEffect(): StatusEffect {
    return this.effect;
  }
}
