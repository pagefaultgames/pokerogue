import type { ObjectValues } from "#types/type-helpers";

/**
 * Not to be confused with an Ability Attribute.
 * This is an object literal storing the slot that an ability can occupy.
 */
export const AbilityAttr = Object.freeze({
  ABILITY_1: 1,
  ABILITY_2: 2,
  ABILITY_HIDDEN: 4,
});

export type AbilityAttr = ObjectValues<typeof AbilityAttr>;
