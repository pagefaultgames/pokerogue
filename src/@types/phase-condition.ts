import type { PhaseMap, PhaseString } from "#app/@types/phase-types";

/** Function type for a phase of a particular type to a boolean */
export type PhaseConditionFunc<T extends PhaseString> = (phase: PhaseMap[T]) => boolean;
