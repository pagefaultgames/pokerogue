import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { FriendshipBoostParams } from "#types/held-item-parameter";

/**
 * Class used for items that boost the amount of friendship gained from battles.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Soothe_Bell}
 */
export class FriendshipBoosterHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.FRIENDSHIP_BOOSTER> {
  public override readonly effect = HeldItemEffect.FRIENDSHIP_BOOSTER;

  public override apply({ pokemon, friendship }: FriendshipBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * stackCount));
  }
}
