import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { FriendshipBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

export class FriendshipBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.FRIENDSHIP_BOOSTER]> {
  public readonly effects = [HeldItemEffect.FRIENDSHIP_BOOSTER] as const;

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description");
  }

  apply(_effect: typeof HeldItemEffect.FRIENDSHIP_BOOSTER, { pokemon, friendship }: FriendshipBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * stackCount));
  }
}
