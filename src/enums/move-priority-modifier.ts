import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing modifiers for Move priorities.
 */
export const MovePriorityModifier = Object.freeze({
  /** Used when moves go last in their priority bracket, but before moves of lower priority. */
  LAST_IN_BRACKET: 0,
  NORMAL: 1,
  /** Used when moves go first in their priority bracket, but before moves of lower priority. */
  FIRST_IN_BRACKET: 2,
});
export type MovePriorityModifier = ObjectValues<typeof MovePriorityModifier>;
