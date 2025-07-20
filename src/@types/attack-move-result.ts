import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { DamageResult } from "#types/damage-result";

export interface AttackMoveResult {
  move: MoveId;
  result: DamageResult;
  damage: number;
  critical: boolean;
  sourceId: number;
  sourceBattlerIndex: BattlerIndex;
}
