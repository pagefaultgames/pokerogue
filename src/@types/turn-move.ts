import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { MoveResult } from "#enums/move-result";

export interface TurnMove {
  move: MoveId;
  targets: BattlerIndex[];
  result?: MoveResult;
  virtual?: boolean;
  turn?: number;
  ignorePP?: boolean;
}
