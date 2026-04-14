import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { StatusEffect } from "#enums/status-effect";
import { HeldItem } from "#items/held-item";
import type { TurnEndStatusParams } from "#types/held-item-parameter";

/**
 * Class used for held items that inflict a status effect on the holder at the end of each turn.
 * Used for Flame Orb and Toxic Orb.
 * @sealed
 */
export class TurnEndStatusHeldItem extends HeldItem<[typeof HeldItemEffect.TURN_END_STATUS]> {
  public readonly effects = [HeldItemEffect.TURN_END_STATUS] as const;
  /** The status effect to be applied. */
  public readonly effect: StatusEffect;

  constructor(type: HeldItemId, maxStackCount: number, effect: StatusEffect) {
    super(type, maxStackCount);

    this.effect = effect;
  }

  public override shouldApply(
    _effect: typeof HeldItemEffect.TURN_END_STATUS,
    { pokemon }: TurnEndStatusParams,
  ): boolean {
    return pokemon.canSetStatus(this.effect, true, false, pokemon, false);
  }

  apply(_effect: typeof HeldItemEffect.TURN_END_STATUS, { pokemon }: TurnEndStatusParams): void {
    pokemon.trySetStatus(this.effect, pokemon, undefined, this.name);
  }
}
