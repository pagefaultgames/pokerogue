import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import type { SessionSaveData } from "#system/game-data";
import type { SessionSaveMigrator } from "#types/session-save-migrator";
import type { TurnMove } from "#types/turn-move";

/** Prior signature of `TurnMove`; used to ensure parity */
interface OldTurnMove {
  move: MoveId;
  targets: BattlerIndex[];
  result?: MoveResult;
  turn?: number;
  virtual?: boolean;
  ignorePP?: boolean;
}

/**
 * Fix player pokemon move history entries with updated `MoveUseModes`,
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
      // NOTE: This unfortuately has to mis-classify Dancer and Magic Bounce-induced moves as `FOLLOW_UP`,
      // given we previously had _no way_ of distinguishing them from follow-up moves post hoc.
      useMode: tm.virtual ? MoveUseMode.FOLLOW_UP : tm.ignorePP ? MoveUseMode.IGNORE_PP : MoveUseMode.NORMAL,
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

export const sessionMigrators: readonly SessionSaveMigrator[] = [fixMoveHistory] as const;
