import type { BattleStat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";

/**
 * Represents a single stat stage change. Readonly to avoid accidental changes.
 */
export interface StatChange {
  readonly stat: BattleStat;
  readonly stages: number;
}

export type StatStageChangeCallback = (target: Pokemon | null, changed: readonly StatChange[]) => void;
