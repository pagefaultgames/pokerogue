import type { BattleStat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";

/**
 * Represents a single stat stage change.
 */
export interface StatChange {
  readonly stat: BattleStat;
  stages: number;
}

export type StatStageChangeCallback = (target: Pokemon | null, changed: StatChange[]) => void;
