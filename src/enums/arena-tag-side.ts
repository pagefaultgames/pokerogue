import type { ArenaTag } from "#data/arena-tag";
import type { ArenaFlyout } from "#ui/arena-flyout";

/**
 * Enum used to represent a given side of the field for the purposes of {@linkcode ArenaTag}s and
 * the current {@linkcode ArenaFlyout}.
 */
export enum ArenaTagSide {
  /**
   * The effect applies to both sides of the field (player & enemy).
   * Also used for the purposes of displaying weather and other "field-based" effects in the flyout.
   */
  BOTH,
  /** The effect applies exclusively to the player's side of the field. */
  PLAYER,
  /** The effect applies exclusively to the opposing side of the field. */
  ENEMY
}
