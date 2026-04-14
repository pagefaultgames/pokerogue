import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { FlinchChanceParams } from "#types/held-item-parameter";

/**
 * Class for held items that grant a chance to flinch opponents on moves that do not already do so.
 * Used for King's Rock.
 * @sealed
 */
export class FlinchChanceHeldItem extends HeldItem<[typeof HeldItemEffect.FLINCH_CHANCE]> {
  public readonly effects = [HeldItemEffect.FLINCH_CHANCE] as const;
  private readonly chance: number;

  constructor(type: HeldItemId, maxStackCount: number, chance: number) {
    super(type, maxStackCount);

    this.chance = chance;
  }

  /**
   * Checks if {@linkcode FlinchChanceModifier} should be applied
   * @param _effect - Unused
   * @param flinched {@linkcode BooleanHolder} that is `true` if the pokemon flinched
   */
  override shouldApply(
    _effect: typeof HeldItemEffect.FLINCH_CHANCE,
    { pokemon, flinched }: FlinchChanceParams,
  ): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return !flinched.value && pokemon.randBattleSeedInt(100) < stackCount * this.chance;
  }

  apply(_effect: typeof HeldItemEffect.FLINCH_CHANCE, { flinched }: FlinchChanceParams): void {
    flinched.value = true;
  }
}
