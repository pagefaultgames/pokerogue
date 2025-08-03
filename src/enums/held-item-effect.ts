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
  BASE_STAT_BOOSTER: 7,
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
  MULTI_HIT: 19,
  DAMAGE_MONEY_REWARD: 20,
  BATON: 21,
  TURN_END_ITEM_STEAL: 22,
  CONTACT_ITEM_STEAL_CHANCE: 23,
  EVO_TRACKER: 40,
  BASE_STAT_TOTAL: 50,
  BASE_STAT_FLAT: 51,
  INCREMENTING_STAT: 52,
} as const;

export type HeldItemEffect = ObjectValues<typeof HeldItemEffect>;
