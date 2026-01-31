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
   * @see {@link https://bulbapedia.bulbagarden.net/wiki/Quash_(move) | Quash (Bulbapedia)}
   */
  LAST: 0,
  /**
   * The default priority modifier; has no bearing on move order.
   */
  NORMAL: 1,
  /**
   * Forces the given move to always act first.
   * @see {@link https://bulbapedia.bulbagarden.net/wiki/Instruct_(move) | Instruct (Bulbapedia)}
   * @see {@link https://bulbapedia.bulbagarden.net/wiki/After_You_(move) | After You (Bulbapedia)}
   */
  FIRST: 2,
});

export type MovePhaseTimingModifier = ObjectValues<typeof MovePhaseTimingModifier>;
