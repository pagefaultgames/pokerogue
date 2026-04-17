import type { BattleStat } from "#enums/stat";
import type { StatChange } from "#types/stat-change";

export function groupStatChange(stats: BattleStat[], stages: number): StatChange[] {
  return stats.map(stat => ({ stat, stages }));
}
