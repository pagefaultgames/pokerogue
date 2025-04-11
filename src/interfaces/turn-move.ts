import type { BattlerIndex } from "#app/battle";
import type { MoveResult } from "#app/field/pokemon";
import type { Moves } from "#enums/moves";

export interface TurnMove {
  move: Moves;
  targets: BattlerIndex[];
  result?: MoveResult;
  virtual?: boolean;
  turn?: number;
  ignorePP?: boolean;
}
