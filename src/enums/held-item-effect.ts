import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing the various "classes" of item effects that can be applied.
 */
export const HeldItemEffect = {
  ATTACK_TYPE_BOOST: 1,
  TURN_END_HEAL: 2,
  HIT_HEAL: 3,
  RESET_NEGATIVE_STAT_STAGE: 4,
  EXP_BOOSTER: 5,
  // Should we actually distinguish different berry effects?
  BERRY: 6,
  BASE_STAT_MULTIPLY: 7,
  INSTANT_REVIVE: 8,
  STAT_BOOST: 9,
  CRIT_BOOST: 10,
  TURN_END_STATUS: 11,
  SURVIVE_CHANCE: 12,
  BYPASS_SPEED_CHANCE: 13,
  FLINCH_CHANCE: 14,
  FIELD_EFFECT: 15,
  FRIENDSHIP_BOOSTER: 16,
  NATURE_WEIGHT_BOOSTER: 17,
  ACCURACY_BOOSTER: 18,
  MULTI_HIT_DAMAGE: 19,
  MULTI_HIT_COUNT: 20,
  DAMAGE_MONEY_REWARD: 21,
  BATON: 22,
  TURN_END_ITEM_STEAL: 23,
  CONTACT_ITEM_STEAL_CHANCE: 24,
  // TODO: Why do these start at 50?
  BASE_STAT_ADD: 50,
  MACHO_BRACE: 51,
} as const;

export type HeldItemEffect = ObjectValues<typeof HeldItemEffect>;
