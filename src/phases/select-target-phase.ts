import { globalScene } from "#app/global-scene";
import { allMoves } from "#data/data-lists";
import type { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { MoveFlags } from "#enums/move-flags";
import { UiMode } from "#enums/ui-mode";
import { PokemonPhase } from "#phases/pokemon-phase";
import i18next from "i18next";

export class SelectTargetPhase extends PokemonPhase {
  public readonly phaseName = "SelectTargetPhase";
  // biome-ignore lint/complexity/noUselessConstructor: This makes `fieldIndex` required
  constructor(fieldIndex: number) {
    super(fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = globalScene.currentBattle.turnCommands[this.fieldIndex];
    const move = turnCommand?.move?.move;
    const moveObject = move ? allMoves[move] : null;
    const fieldSide = globalScene.getField();
    const { double } = globalScene.currentBattle;

    let defaultTarget: BattlerIndex | undefined;
    const allyDefault = moveObject?.hasFlag(MoveFlags.ALLY_TARGET_DEFAULT) ?? false;

    if (!moveObject) {
      this.end();
      return;
    }

    if (allyDefault && double) {
      const user = fieldSide[this.fieldIndex];
      const allyIndex = user.getAlly()?.getBattlerIndex();

      if (allyIndex !== undefined) {
        const ally = fieldSide[allyIndex];
        if (ally && ally.hp > 0) {
          defaultTarget = allyIndex;
        }
      }
    }

    const defaultTargetArray = defaultTarget !== undefined ? [defaultTarget] : undefined;

    globalScene.ui.setMode(
      UiMode.TARGET_SELECT,
      this.fieldIndex,
      move,
      (targets: BattlerIndex[]) => {
        globalScene.ui.setMode(UiMode.MESSAGE);
        const user = fieldSide[this.fieldIndex];
        if (moveObject && targets[0] && user.isMoveTargetRestricted(moveObject.id, user, fieldSide[targets[0]])) {
          const errorMessage = user
            .getRestrictingTag(move!, user, fieldSide[targets[0]])!
            .selectionDeniedText(user, moveObject.id);
          globalScene.phaseManager.queueMessage(i18next.t(errorMessage, { moveName: moveObject.name }), 0, true);
          targets = [];
        }
        if (targets.length === 0) {
          globalScene.currentBattle.turnCommands[this.fieldIndex] = null;
          globalScene.phaseManager.unshiftNew("CommandPhase", this.fieldIndex);
        } else {
          turnCommand!.targets = targets;
        }
        if (turnCommand?.command === Command.BALL && this.fieldIndex) {
          globalScene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
        }
        this.end();
      },
      defaultTargetArray,
    );
  }
}
