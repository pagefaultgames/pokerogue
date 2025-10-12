import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { FlinchChanceParams } from "#types/held-item-parameter";

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @see {@linkcode apply}
 */
export class FlinchChanceHeldItem extends HeldItem<[typeof HeldItemEffect.FLINCH_CHANCE]> {
  public readonly effects = [HeldItemEffect.FLINCH_CHANCE] as const;
  private readonly chance: number;

  constructor(type: HeldItemId, maxStackCount: number, chance: number) {
    super(type, maxStackCount);

    this.chance = chance; // 10
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
    // The check for pokemon.summonData is to ensure that a crash doesn't occur when a Pokemon with King's Rock procs a flinch
  }

  apply(_effect: typeof HeldItemEffect.FLINCH_CHANCE, { flinched }: FlinchChanceParams): boolean {
    flinched.value = true;
  }
}
