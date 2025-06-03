import type { BattlerIndex } from "#app/battle";
import type { Moves } from "#enums/moves";
import type { DamageResult } from "#app/field/pokemon";

export interface AttackMoveResult {
  move: Moves;
  result: DamageResult;
  damage: number;
  critical: boolean;
  sourceId: number;
  sourceBattlerIndex: BattlerIndex;
}
