import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { StatusEffect } from "#enums/status-effect";
import { HeldItem } from "#items/held-item";
import type { TurnEndStatusParams } from "#types/held-item-parameter";

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class TurnEndStatusHeldItem extends HeldItem<[typeof HeldItemEffect.TURN_END_STATUS]> {
  public readonly effects = [HeldItemEffect.TURN_END_STATUS] as const;
  /** The status effect to be applied by the held item */
  public effect: StatusEffect;

  constructor(type: HeldItemId, maxStackCount: number, effect: StatusEffect) {
    super(type, maxStackCount);

    this.effect = effect;
  }

  override shouldApply(_effect: typeof HeldItemEffect.TURN_END_STATUS, { pokemon }: TurnEndStatusParams): boolean {
    return pokemon.canSetStatus(this.effect, true, false, pokemon, false);
  }
  /**
   * Tries to inflicts the holder with the associated {@linkcode StatusEffect}.
   * @returns `true` if the status effect was applied successfully
   */
  apply(_effect: typeof HeldItemEffect.TURN_END_STATUS, { pokemon }: TurnEndStatusParams): void {
    pokemon.trySetStatus(this.effect, pokemon, undefined, this.name);
  }

  getStatusEffect(): StatusEffect {
    return this.effect;
  }
}
