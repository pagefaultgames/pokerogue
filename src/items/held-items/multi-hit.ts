import { allMoves } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { HeldItemEffectParamMap, MultiHitCountParams, MultiHitDamageParams } from "#items/held-item-parameter";
import type { NumberHolder } from "#utils/common";
import i18next from "i18next";

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class MultiHitHeldItem extends HeldItem<
  [typeof HeldItemEffect.MULTI_HIT_COUNT, typeof HeldItemEffect.MULTI_HIT_DAMAGE]
> {
  public readonly effects = [HeldItemEffect.MULTI_HIT_COUNT, HeldItemEffect.MULTI_HIT_DAMAGE] as const;

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonMultiHitModifierType.description");
  }

  /**
   * For each stack, converts 25 percent of attack damage into an additional strike.
   * @returns Whether the item applies its effects to move
   */
  apply<E extends this["effects"][number]>(effect: E, param: HeldItemEffectParamMap[E]) {
    const { moveId, pokemon } = param;
    const move = allMoves[moveId];
    /*
     * The move must meet Parental Bond's restrictions for this item
     * to apply. This means
     * - Only attacks are boosted
     * - Multi-strike moves, charge moves, and self-sacrificial moves are not boosted
     *   (though Multi-Lens can still affect moves boosted by Parental Bond)
     * - Multi-target moves are not boosted *unless* they can only hit a single Pokemon
     * - Fling, Uproar, Rollout, Ice Ball, and Endeavor are not boosted
     */
    if (!move.canBeMultiStrikeEnhanced(pokemon)) {
      return false;
    }

    if (effect === HeldItemEffect.MULTI_HIT_COUNT) {
      const { count } = param as MultiHitCountParams;
      return this.applyHitCountBoost(pokemon, count);
    }
    if (effect === HeldItemEffect.MULTI_HIT_DAMAGE) {
      const { damageMultiplier } = param as MultiHitDamageParams;
      return this.applyDamageModifier(pokemon, damageMultiplier);
    }
  }

  /** Adds strikes to a move equal to the number of stacked Multi-Lenses */
  private applyHitCountBoost(pokemon: Pokemon, count: NumberHolder): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    count.value += stackCount;
    return true;
  }

  /**
   * If applied to the first hit of a move, sets the damage multiplier
   * equal to (1 - the number of stacked Multi-Lenses).
   * Additional strikes beyond that are given a 0.25x damage multiplier
   */
  private applyDamageModifier(pokemon: Pokemon, damageMultiplier: NumberHolder): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.turnData.hitsLeft === pokemon.turnData.hitCount) {
      // Reduce first hit by 25% for each stack count
      damageMultiplier.value *= 1 - 0.25 * stackCount;
      return true;
    }
    if (pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== stackCount + 1) {
      // Deal 25% damage for each remaining Multi Lens hit
      damageMultiplier.value *= 0.25;
      return true;
    }
    // An extra hit not caused by Multi Lens -- assume it is Parental Bond
    return false;
  }
}
