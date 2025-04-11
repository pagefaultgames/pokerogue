import type { BattlerIndex } from "#app/battle";
import type { DamageResult } from "#app/@types/damage-result";
import type { Moves } from "#enums/moves";

export interface AttackMoveResult {
  move: Moves;
  result: DamageResult;
  damage: number;
  critical: boolean;
  sourceId: number;
  sourceBattlerIndex: BattlerIndex;
}
