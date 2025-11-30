import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing modifiers for Move priorities.
 */
export const MovePriorityInBracket = Object.freeze({
  /** Used when moves go last in their priority bracket, but before moves of lower priority. */
  LAST: 0,
  NORMAL: 1,
  /** Used when moves go first in their priority bracket, but before moves of lower priority. */
  FIRST: 2,
});
export type MovePriorityInBracket = ObjectValues<typeof MovePriorityInBracket>;
