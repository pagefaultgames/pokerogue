import type { SessionSaveMigrator } from "#app/@types/SessionSaveMigrator";
import type { BattlerIndex } from "#app/battle";
import type { MoveResult, TurnMove } from "#app/field/pokemon";
import type { SessionSaveData } from "#app/system/game-data";
import { MoveUseType } from "#enums/move-use-type";
import type { Moves } from "#enums/moves";

/** Prior signature of `TurnMove`; used to ensure parity */
interface OldTurnMove {
  move: Moves;
  targets: BattlerIndex[];
  result?: MoveResult;
  virtual?: boolean;
  turn?: number;
  ignorePP?: boolean;
}

/**
 * Fix player pokemon move history entries with updated `MoveUseTypes`,
 * based on the prior values of `virtual` and `ignorePP`.
 * Needed to ensure Last Resort and move-calling moves still work OK.
 * @param data - {@linkcode SystemSaveData}
 */
const fixMoveHistory: SessionSaveMigrator = {
  version: "1.10.0",
  migrate: (data: SessionSaveData): void => {
    const mapTurnMove = (tm: OldTurnMove): TurnMove => ({
      move: tm.move,
      targets: tm.targets,
      result: tm.result,
      turn: tm.turn,
      // NOTE: This currently mis-classifies Dancer and Magic Bounce-induced moves, but not much we can do about it tbh
      useType: tm.virtual ? MoveUseType.FOLLOW_UP : tm.ignorePP ? MoveUseType.IGNORE_PP : MoveUseType.NORMAL,
    });
    data.party.forEach(pkmn => {
      pkmn.summonData.moveHistory = (pkmn.summonData.moveHistory as OldTurnMove[]).map(mapTurnMove);
      pkmn.summonData.moveQueue = (pkmn.summonData.moveQueue as OldTurnMove[]).map(mapTurnMove);
    });
    data.enemyParty.forEach(pkmn => {
      pkmn.summonData.moveHistory = (pkmn.summonData.moveHistory as OldTurnMove[]).map(mapTurnMove);
      pkmn.summonData.moveQueue = (pkmn.summonData.moveQueue as OldTurnMove[]).map(mapTurnMove);
    });
  },
};

export const sessionMigrators: Readonly<SessionSaveMigrator[]> = [fixMoveHistory] as const;
