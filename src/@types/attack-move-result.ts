import type { BattlerIndex } from "#enums/battler-index";
import type { DamageResult } from "#app/field/pokemon";
import type { MoveId } from "#enums/move-id";

export interface AttackMoveResult {
  move: MoveId;
  result: DamageResult;
  damage: number;
  critical: boolean;
  sourceId: number;
  sourceBattlerIndex: BattlerIndex;
}
