import type { MoveId } from "#enums/move-id";
import type { MovePhase } from "#phases/move-phase";
import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing modifiers for the timing of {@linkcode MovePhase}s. \
 * Used by effects that force Pokemon to move in a certain order.
 *
 * @remarks
 * This system is entirely independent of, and _takes full precedence over_,
 * speed order and move priority.
 */
export const MovePhaseTimingModifier = Object.freeze({
  /**
   * Forces the given move to always act last.
   * Used by {@linkcode MoveId.QUASH}.
   */
  LAST: 0,
  /**
   * The default priority modifier; has no bearing on move order.
   */
  NORMAL: 1,
  /**
   * Forces the given move to always act first.
   * Used by {@linkcode MoveId.INSTRUCT} and {@linkcode MoveId.AFTER_YOU}.
   */
  FIRST: 2,
});
export type MovePhaseTimingModifier = ObjectValues<typeof MovePhaseTimingModifier>;

/**
 * Doc comment to suppress IDE unused import errors.
 * {@linkcode MoveId}
 */
