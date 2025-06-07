import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import { HeldItem, ITEM_EFFECT } from "../held-item";

export interface FRIENDSHIP_BOOST_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  friendship: NumberHolder;
}

export class FriendshipBoosterHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.FRIENDSHIP_BOOSTER];

  /**
   * Applies {@linkcode PokemonFriendshipBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the friendship boost to
   * @param friendship {@linkcode NumberHolder} holding the friendship boost value
   * @returns always `true`
   */
  apply(params: FRIENDSHIP_BOOST_PARAMS): boolean {
    const pokemon = params.pokemon;
    const friendship = params.friendship;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * stackCount));

    return true;
  }
}
