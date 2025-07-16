import type { PhaseMap, PhaseString } from "#app/@types/phase-types";
import type { Phase } from "#app/phase";

export type PhaseConditionFunc<T extends PhaseString> = (phase: PhaseMap[T]) => boolean;

export type GeneralPhaseConditionFunc = (phase: Phase) => boolean;
