import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem, HeldItemEffect } from "../held-item";

export interface AccuracyBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  moveAccuracy: NumberHolder;
}

export class AccuracyBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.ACCURACY_BOOSTER];

  private accuracyAmount: number;

  constructor(type: HeldItemId, maxStackCount: number, accuracy: number) {
    super(type, maxStackCount);
    this.accuracyAmount = accuracy;
  }

  /**
   * Checks if {@linkcode PokemonMoveAccuracyBoosterModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} to apply the move accuracy boost to
   * @param moveAccuracy {@linkcode NumberHolder} holding the move accuracy boost
   * @returns `true` if {@linkcode PokemonMoveAccuracyBoosterModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, moveAccuracy?: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, moveAccuracy) && !!moveAccuracy;
  //  }

  /**
   * Applies {@linkcode PokemonMoveAccuracyBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the move accuracy boost to
   * @param moveAccuracy {@linkcode NumberHolder} holding the move accuracy boost
   * @returns always `true`
   */
  apply(params: AccuracyBoostParams): boolean {
    const pokemon = params.pokemon;
    const moveAccuracy = params.moveAccuracy;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    moveAccuracy.value = moveAccuracy.value + this.accuracyAmount * stackCount;

    return true;
  }
}
