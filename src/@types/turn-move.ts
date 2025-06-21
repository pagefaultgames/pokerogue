import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { MoveResult } from "#enums/move-result";
import type { MoveUseMode } from "#enums/move-use-mode";

/** A record of a move having been used. */
export interface TurnMove {
  move: MoveId;
  targets: BattlerIndex[];
  useMode: MoveUseMode;
  result?: MoveResult;
  turn?: number;
}
