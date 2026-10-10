import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { FlinchChanceParams } from "#types/held-item-parameter";

/**
 * Class for held items that grant a chance to flinch opponents on moves that do not already do so.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/King%27s_Rock}
 * @sealed
 */
export class FlinchChanceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.FLINCH_CHANCE> {
  public override readonly effect = HeldItemEffect.FLINCH_CHANCE;
  private readonly chance: number;

  constructor(chance: number) {
    super();
    this.chance = chance;
  }

  public override shouldApply({ pokemon, flinched }: FlinchChanceParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return !flinched.value && pokemon.randBattleSeedInt(100) < stackCount * this.chance;
  }

  public override apply({ flinched }: FlinchChanceParams): void {
    flinched.value = true;
  }
}
