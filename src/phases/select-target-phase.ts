import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { UiMode } from "#enums/ui-mode";
import { PokemonPhase } from "#phases/pokemon-phase";

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
    globalScene.ui.setMode(UiMode.TARGET_SELECT, this.fieldIndex, move, (targets: BattlerIndex[]) => {
      globalScene.ui.setMode(UiMode.MESSAGE);
      // Find any tags blocking this target from being selected
      // TODO: Denest and make less jank
      if (move) {
        const fieldSide = globalScene.getField();
        const user = fieldSide[this.fieldIndex];
        const target = fieldSide[targets[0]];
        if (target) {
          const restrictedTag = user.getTargetRestrictingTag(move, target);
          if (restrictedTag) {
            const errorMessage = restrictedTag.selectionDeniedText(user, move);
            globalScene.phaseManager.queueMessage(errorMessage, 0, true);
            targets = [];
          }
        }
      }
      if (targets.length === 0) {
        globalScene.currentBattle.turnCommands[this.fieldIndex] = null;
        globalScene.phaseManager.unshiftNew("CommandPhase", this.fieldIndex);
      } else {
        turnCommand!.targets = targets; //TODO: is the bang correct here?
      }
      // If Pokemon 1 threw a ball, skip both pokemon's commands
      // TODO: This may be redundant and almost certainly shouldn't be occurring here
      if (turnCommand?.command === Command.BALL && this.fieldIndex > 0) {
        globalScene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true; //TODO: is the bang correct here?
      }
      this.end();
    });
  }
}
