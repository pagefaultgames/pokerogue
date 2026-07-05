import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import type { SessionSaveMigrator } from "#types/save-migrators";
import type { TurnMove } from "#types/turn-move";
import { ensurePropertyIsObject, validateIsArrayOfObjects } from "#utils/migrator-utils";

/** Prior signature of `TurnMove`; used to ensure parity */
interface OldTurnMove {
  move: MoveId;
  targets: BattlerIndex[];
  result?: MoveResult | undefined;
  turn?: number | undefined;
  virtual?: boolean | undefined;
  ignorePP?: boolean | undefined;
}

function mapTurnMove(tm: OldTurnMove): TurnMove {
  return {
    move: tm.move,
    targets: tm.targets,
    result: tm.result,
    // NOTE: This unfortuately has to mis-classify Dancer and Magic Bounce-induced moves as `FOLLOW_UP`,
    // given we previously had _no way_ of distinguishing them from follow-up moves post hoc.
    useMode: tm.virtual ? MoveUseMode.FOLLOW_UP : tm.ignorePP ? MoveUseMode.IGNORE_PP : MoveUseMode.NORMAL,
  };
}

function migrateSummonData(summonData: Record<string, unknown>): void {
  if ("moveHistory" in summonData && Array.isArray(summonData.moveHistory)) {
    summonData.moveHistory = summonData.moveHistory.map(mapTurnMove);
  } else {
    summonData["moveHistory"] = [];
  }
  if ("moveQueue" in summonData && Array.isArray(summonData.moveQueue)) {
    summonData.moveQueue = summonData.moveQueue.map(mapTurnMove);
  } else {
    summonData["moveQueue"] = [];
  }
}
/**
 * Fix player pokemon move history entries with updated `MoveUseModes`,
 * based on the prior values of `virtual` and `ignorePP`.
 * Needed to ensure Last Resort and move-calling moves still work OK.
 * @param data - {@linkcode SystemSaveData}
 */
const fixMoveHistory: SessionSaveMigrator = {
  version: "1.10.0",
  migrate: data => {
    data.party.forEach(pkmn => {
      ensurePropertyIsObject(pkmn, "summonData");
      migrateSummonData(pkmn.summonData);
    });

    const enemyParty = data.enemyParty;
    if (validateIsArrayOfObjects(enemyParty)) {
      enemyParty.forEach(pkmn => {
        ensurePropertyIsObject(pkmn, "summonData");
        migrateSummonData(pkmn.summonData);
      });
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [fixMoveHistory] as const;
