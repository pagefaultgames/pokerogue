import type { BattleStat } from "#enums/stat";
import type { StatChange } from "#types/stat-change";

/**
 * Create a {@linkcode StatChange} array which maps the same stage amount to each provided stat.
 * @param stats - The stats to change
 * @param stages - The number of stages to change each stat by
 * @returns The constructed {@linkcode StatChange}s
 */
export function groupStatChange(stats: readonly BattleStat[], stages: number): StatChange[] {
  return stats.map(stat => ({ stat, stages }));
}
