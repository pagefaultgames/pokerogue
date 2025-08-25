import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing modifiers for the timing of MovePhases.
 * 
 * {@linkcode MovePhaseTimingModifier.FIRST | FIRST} is used to trigger moves immediately (i.e. ones that were called through Instruct).
 * 
 * {@linkcode MovePhaseTimingModifier.LAST | LAST} is used when moves go last regardless of speed and priority (i.e. Quash).
 * 
 * @remarks
 * This system is entirely independent of and takes precedence over move priority
 */
export const MovePhaseTimingModifier = Object.freeze({
  LAST: 0,
  NORMAL: 1,
  FIRST: 2,
});
export type MovePhaseTimingModifier = ObjectValues<typeof MovePhaseTimingModifier>;