import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing modifiers for the timing of MovePhases.
 *
 * @remarks
 * This system is entirely independent of and takes precedence over move priority
 */
export const MovePhaseTimingModifier = Object.freeze({
  /** Used when moves go last regardless of speed and priority (i.e. Quash) */
  LAST: 0,
  NORMAL: 1,
  /** Used to trigger moves immediately (i.e. ones that were called through Instruct). */
  FIRST: 2,
});
export type MovePhaseTimingModifier = ObjectValues<typeof MovePhaseTimingModifier>;
