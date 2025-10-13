import { allMoves } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { MultiHitCountParams, MultiHitDamageParams } from "#types/held-item-parameter";
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

  private shouldApplyDamageModifier({ pokemon }: MultiHitDamageParams): boolean {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    return (
      pokemon.turnData.hitsLeft === pokemon.turnData.hitCount
      || pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== stackCount + 1
    );
  }

  override shouldApply(effect: typeof HeldItemEffect.MULTI_HIT_COUNT, params: MultiHitCountParams): boolean;
  override shouldApply(effect: typeof HeldItemEffect.MULTI_HIT_DAMAGE, params: MultiHitDamageParams): boolean;
  override shouldApply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): boolean;
  public override shouldApply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): boolean {
    const { moveId, pokemon } = params;
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

    if (effect === HeldItemEffect.MULTI_HIT_DAMAGE) {
      return this.shouldApplyDamageModifier(params);
    }

    return true;
  }

  /**
   * For each stack, adds one additional hit
   * @param effect - The effect to apply, in this override, must be `HeldItemEffect.MULTI_HIT_COUNT`
   * @param params - The parameters associated with the effect
   */
  override apply(effect: typeof HeldItemEffect.MULTI_HIT_COUNT, params: MultiHitCountParams): void;
  /**
   * For each stack, reduces the damage of the hit by 25%
   * @param effect - The effect to apply, in this override, must be `HeldItemEffect.MULTI_HIT_DAMAGE`
   * @param params - The parameters associated with the effect
   *
   * @see {@linkcode applyDamageModifier}
   */
  override apply(effect: typeof HeldItemEffect.MULTI_HIT_DAMAGE, params: MultiHitDamageParams): void;
  /**
   * For each stack, adds one additional hit and reduces the damage of the hit by 25%
   * @param effect - The effect to apply, which is either `HeldItemEffect.MULTI_HIT_COUNT` or `HeldItemEffect.MULTI_HIT_DAMAGE`
   * @param params - The parameters associated with the effect
   */
  override apply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): void;
  override apply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): void {
    const pokemon = params.pokemon;

    switch (effect) {
      case HeldItemEffect.MULTI_HIT_COUNT:
        this.applyHitCountBoost(pokemon, params.count);
        return;
      case HeldItemEffect.MULTI_HIT_DAMAGE:
        this.applyDamageModifier(pokemon, params.damageMultiplier);
        return;
    }
  }

  /** Adds strikes to a move equal to the number of stacked Multi-Lenses */
  private applyHitCountBoost(pokemon: Pokemon, count: NumberHolder): void {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    count.value += stackCount;
  }

  /**
   * If applied to the first hit of a move, sets the damage multiplier
   * equal to (1 - the number of stacked Multi-Lenses).
   * Additional strikes beyond that are given a 0.25x damage multiplier
   */
  private applyDamageModifier(pokemon: Pokemon, damageMultiplier: NumberHolder): void {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    if (pokemon.turnData.hitsLeft === pokemon.turnData.hitCount) {
      // Reduce first hit by 25% for each stack count
      damageMultiplier.value *= 1 - 0.25 * stackCount;
    } else if (pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== stackCount + 1) {
      // Deal 25% damage for each remaining Multi Lens hit
      damageMultiplier.value *= 0.25;
    }
  }
}
