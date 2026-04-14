import { allMoves } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { MultiHitCountParams, MultiHitDamageParams } from "#types/held-item-parameter";
import type { NumberHolder } from "#utils/common";
import i18next from "i18next";

/**
 * Class used for held items that add additional hits to a move and reduce its damage proportionally.
 * Used by Multi Lens.
 * @sealed
 */
export class MultiHitHeldItem extends HeldItem<
  [typeof HeldItemEffect.MULTI_HIT_COUNT, typeof HeldItemEffect.MULTI_HIT_DAMAGE]
> {
  public readonly effects = [HeldItemEffect.MULTI_HIT_COUNT, HeldItemEffect.MULTI_HIT_DAMAGE] as const;

  public override get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonMultiHitModifierType.description");
  }

  private shouldApplyDamageModifier({ pokemon }: MultiHitDamageParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return (
      pokemon.turnData.hitsLeft === pokemon.turnData.hitCount
      || pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== stackCount + 1
    );
  }

  override shouldApply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): boolean {
    const { moveId, pokemon } = params;
    const move = allMoves[moveId];

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
   * @param effect - {@linkcode HeldItemEffect.MULTI_HIT_COUNT}
   * @param params - The parameters associated with the effect
   */
  public override apply(effect: typeof HeldItemEffect.MULTI_HIT_COUNT, params: MultiHitCountParams): void;
  /**
   * For each stack, reduces the damage of the hit by 25%
   * @param effect - {@linkcode HeldItemEffect.MULTI_HIT_DAMAGE}
   * @param params - The parameters associated with the effect
   */
  public override apply(effect: typeof HeldItemEffect.MULTI_HIT_DAMAGE, params: MultiHitDamageParams): void;
  // TODO: This implementation signature does not restrict us from using the wrong parameter type (and hence, crashing)
  public override apply(
    effect: typeof HeldItemEffect.MULTI_HIT_COUNT | typeof HeldItemEffect.MULTI_HIT_DAMAGE,
    params: MultiHitCountParams & MultiHitDamageParams,
  ): void {
    const { pokemon } = params;

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
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    count.value += stackCount;
  }

  /**
   * If applied to the first hit of a move, sets the damage multiplier
   * equal to (1 - the number of stacked Multi-Lenses).
   * Additional strikes beyond that are given a 0.25x damage multiplier
   */
  private applyDamageModifier(pokemon: Pokemon, damageMultiplier: NumberHolder): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.turnData.hitsLeft === pokemon.turnData.hitCount) {
      // Reduce first hit by 25% for each stack count
      damageMultiplier.value *= 1 - 0.25 * stackCount;
    } else if (pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== stackCount + 1) {
      // Deal 25% damage for each remaining Multi Lens hit
      damageMultiplier.value *= 0.25;
    }
  }
}
