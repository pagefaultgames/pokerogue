import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { NumberHolder } from "#utils/common";

export interface AccuracyBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holds the move's accuracy, which may be modified after item application */
  moveAccuracy: NumberHolder;
}

/**
 * @sealed
 */
export class AccuracyBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.ACCURACY_BOOSTER];

  private accuracyAmount: number;

  constructor(type: HeldItemId, maxStackCount: number, accuracy: number) {
    super(type, maxStackCount);
    this.accuracyAmount = accuracy;
  }

  /**
   * Checks if {@linkcode PokemonMoveAccuracyBoosterHeldItem} should be applied
   * @param pokemon - The {@linkcode Pokemon} to apply the move accuracy boost to
   * @param moveAccuracy - {@linkcode NumberHolder} holding the move accuracy boost
   * @returns `true` if {@linkcode PokemonMoveAccuracyBoosterHeldItem} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, moveAccuracy?: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, moveAccuracy) && !!moveAccuracy;
  //  }

  /**
   * Applies {@linkcode PokemonMoveAccuracyBoosterHeldItem}
   */
  apply({ pokemon, moveAccuracy }: AccuracyBoostParams): true {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    moveAccuracy.value += this.accuracyAmount * stackCount;

    return true;
  }
}
