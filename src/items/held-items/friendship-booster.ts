import type { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import type { NumberHolder } from "#utils/common";
import i18next from "i18next";

export interface FriendshipBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  friendship: NumberHolder;
}

export class FriendshipBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.FRIENDSHIP_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description");
  }

  /**
   * Applies {@linkcode PokemonFriendshipBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the friendship boost to
   * @param friendship {@linkcode NumberHolder} holding the friendship boost value
   * @returns always `true`
   */
  apply(params: FriendshipBoostParams): boolean {
    const pokemon = params.pokemon;
    const friendship = params.friendship;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * stackCount));

    return true;
  }
}
