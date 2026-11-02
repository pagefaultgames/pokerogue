import { allMoves } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { MultiHitCountParams, MultiHitDamageParams } from "#types/held-item-parameter";

/**
 * Attribute used for held items that add additional hits to a move.
 * Used by Multi Lens.
 * @sealed
 */
export class MultiHitCountHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.MULTI_HIT_COUNT> {
  public override readonly effect = HeldItemEffect.MULTI_HIT_COUNT;

  public override shouldApply({ moveId, pokemon }: MultiHitCountParams): boolean {
    return allMoves[moveId].canBeMultiStrikeEnhanced(pokemon);
  }

  /**
   * For each stack, reduces the damage of the hit by 25%
   * @param params - The parameters associated with the effect
   */
  public override apply({ pokemon, count }: MultiHitCountParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    count.value += stackCount;
  }
}

export class MultiHitDamageModifyHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.MULTI_HIT_DAMAGE> {
  public override readonly effect = HeldItemEffect.MULTI_HIT_DAMAGE;

  public override shouldApply({ moveId, pokemon }: MultiHitDamageParams): boolean {
    const move = allMoves[moveId];
    if (!move.canBeMultiStrikeEnhanced(pokemon)) {
      return false;
    }

    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const hitsDone = pokemon.turnData.hitCount - pokemon.turnData.hitsLeft;

    // Do not modify the damage of the final hit added by Parental Bond (which occurs after Multi Lens)
    return hitsDone < stackCount + 1;
  }

  public override apply({ pokemon, damageMultiplier }: MultiHitDamageParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.turnData.hitsLeft === pokemon.turnData.hitCount) {
      // Reduce first hit by 25% for each stack count
      damageMultiplier.value *= 1 - 0.25 * stackCount;
    } else if (pokemon.turnData.hitCount - pokemon.turnData.hitsLeft === stackCount + 1) {
      // should be impossible due to `shouldApply` block
      // TODO: Throw an error during testing
    } else {
      // Deal 25% damage for each remaining Multi Lens hit
      damageMultiplier.value *= 0.25;
    }
  }
}
