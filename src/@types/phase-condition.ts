import type { PhaseMap, PhaseString } from "#app/@types/phase-types";

/** Type for predicate functions operating on a specific type of {@linkcode Phase}. */
export type PhaseConditionFunc<T extends PhaseString> = (phase: PhaseMap[T]) => boolean;
