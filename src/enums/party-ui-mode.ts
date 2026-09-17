import type { ObjectValues } from "#types/type-helpers";

/**
 * Indicates the reason why the party UI is being opened.
 */
export const PartyUiMode = {
  /**
   * Indicates that the party UI is open because of a user-opted switch.  This
   * type of switch can be cancelled.
   */
  SWITCH: 0,
  /**
   * Indicates that the party UI is open because of a faint or other forced
   * switch (eg, move effect). This type of switch cannot be cancelled.
   */
  FAINT_SWITCH: 1,
  /**
   * Indicates that the party UI is open because of a start-of-encounter optional
   * switch. This type of switch can be cancelled.
   */
  // TODO: Rename to PRE_BATTLE_SWITCH
  POST_BATTLE_SWITCH: 2,
  /**
   * Indicates that the party UI is open because of the move Revival Blessing.
   * This selection cannot be cancelled.
   */
  REVIVAL_BLESSING: 3,
  /**
   * Indicates that the party UI is open to select a mon to apply a modifier to.
   * This type of selection can be cancelled.
   */
  MODIFIER: 4,
  /**
   * Indicates that the party UI is open to select a mon to apply a move
   * modifier to (such as an Ether or PP Up).  This type of selection can be cancelled.
   */
  MOVE_MODIFIER: 5,
  /**
   * Indicates that the party UI is open to select a mon to teach a TM.  This
   * type of selection can be cancelled.
   */
  TM_MODIFIER: 6,
  /**
   * Indicates that the party UI is open to select a mon to remember a move.
   * This type of selection can be cancelled.
   */
  REMEMBER_MOVE_MODIFIER: 7,
  /**
   * Indicates that the party UI is open to transfer items between mons.  This
   * type of selection can be cancelled.
   */
  MODIFIER_TRANSFER: 8,
  /**
   * Indicates that the party UI is open because of a DNA Splicer.  This
   * type of selection can be cancelled.
   */
  SPLICE: 9,
  /**
   * Indicates that the party UI is open to release a party member.  This
   * type of selection can be cancelled.
   */
  RELEASE: 10,
  /**
   * Indicates that the party UI is open to check the team.  This
   * type of selection can be cancelled.
   */
  CHECK: 11,
  /**
   * Indicates that the party UI is open to select a party member for an arbitrary effect.
   * This is generally used in for Mystery Encounter or special effects that require the player to select a Pokemon
   */
  SELECT: 12,
  /**
   * Indicates that the party UI is open to select a party member from which items will be discarded.
   * This type of selection can be cancelled.
   */
  DISCARD: 13,
} as const;

export type PartyUiMode = ObjectValues<typeof PartyUiMode>;
