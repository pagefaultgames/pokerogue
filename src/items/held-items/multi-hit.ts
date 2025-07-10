import type Pokemon from "#app/field/pokemon";
import { HeldItem, HELD_ITEM_EFFECT } from "#app/items/held-item";
import { isNullOrUndefined, type NumberHolder } from "#app/utils/common";
import type { MoveId } from "#enums/move-id";
import { allMoves } from "#app/data/data-lists";
import i18next from "i18next";

export interface MULTI_HIT_PARAMS {
  pokemon: Pokemon;
  moveId: MoveId;
  count?: NumberHolder;
  damageMultiplier?: NumberHolder;
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class MultiHitHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.MULTI_HIT];

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonMultiHitModifierType.description");
  }

  /**
   * For each stack, converts 25 percent of attack damage into an additional strike.
   * @param pokemon The {@linkcode Pokemon} using the move
   * @param moveId The {@linkcode MoveId | identifier} for the move being used
   * @param count {@linkcode NumberHolder} holding the move's hit count for this turn
   * @param damageMultiplier {@linkcode NumberHolder} holding a damage multiplier applied to a strike of this move
   * @returns always `true`
   */
  apply(params: MULTI_HIT_PARAMS): boolean {
    const pokemon = params.pokemon;
    const move = allMoves[params.moveId];
    /**
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

    if (!isNullOrUndefined(params.count)) {
      return this.applyHitCountBoost(pokemon, params.count);
    }
    if (!isNullOrUndefined(params.damageMultiplier)) {
      return this.applyDamageModifier(pokemon, params.damageMultiplier);
    }

    return false;
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
