import { HeldItemEffect } from "#enums/held-item-effect";
import type { StatusEffect } from "#enums/status-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { TurnEndStatusParams } from "#types/held-item-parameter";

/**
 * Class used for held items that inflict a status effect on the holder at the end of each turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flame_Orb}
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Toxic_Orb}
 * @sealed
 */
export class TurnEndStatusHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.TURN_END_STATUS> {
  public readonly effect = HeldItemEffect.TURN_END_STATUS;
  /** The status effect to be applied. */
  public readonly statusEffect: StatusEffect;

  constructor(statusEffect: StatusEffect) {
    super();

    this.statusEffect = statusEffect;
  }

  public override shouldApply({ pokemon }: TurnEndStatusParams): boolean {
    return pokemon.canSetStatus(this.statusEffect, true, false, pokemon, false);
  }

  public override apply({ pokemon }: TurnEndStatusParams): void {
    pokemon.trySetStatus(this.statusEffect, pokemon, undefined, this.item.name);
  }
}
