import type { BattlerIndex } from "#app/battle";
import type { Moves } from "#enums/moves";
import type { MoveResult } from "#app/field/pokemon";

export interface TurnMove {
  move: Moves;
  targets: BattlerIndex[];
  result?: MoveResult;
  virtual?: boolean;
  turn?: number;
  ignorePP?: boolean;
}
