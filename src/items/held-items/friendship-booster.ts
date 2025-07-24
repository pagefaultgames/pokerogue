import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { NumberHolder } from "#utils/common";
import i18next from "i18next";

export interface FriendshipBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the friendship amount to be changed by the item */
  friendship: NumberHolder;
}

export class FriendshipBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.FRIENDSHIP_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description");
  }

  /**
   * Applies {@linkcode PokemonFriendshipBoosterModifier}
   * @returns always `true`
   */
  apply({ pokemon, friendship }: FriendshipBoostParams): true {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * stackCount));

    return true;
  }
}
