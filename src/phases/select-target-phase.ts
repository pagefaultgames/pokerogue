import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { CommandPhase } from "./command-phase";
import { PokemonPhase } from "./pokemon-phase";
import i18next from "#app/plugins/i18n";
import { allMoves } from "#app/data/move";

export class SelectTargetPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = this.scene.currentBattle.turnCommands[this.fieldIndex];
    const move = turnCommand?.move?.move;
    this.scene.ui.setMode(Mode.TARGET_SELECT, this.fieldIndex, move, (targets: BattlerIndex[]) => {
      this.scene.ui.setMode(Mode.MESSAGE);
      const fieldSide = this.scene.getField();
      const user = fieldSide[this.fieldIndex];
      const moveObject = allMoves[move!];
      if (moveObject && user.isMoveTargetRestricted(moveObject.id, user, fieldSide[targets[0]])) {
        const errorMessage = user.getRestrictingTag(move!, user, fieldSide[targets[0]])!.selectionDeniedText(user, moveObject.id);
        user.scene.queueMessage(i18next.t(errorMessage, { moveName: moveObject.name }), 0, true);
        targets.length = 0;
      }
      if (targets.length < 1) {
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else {
          turnCommand!.targets = targets; //TODO: is the bang correct here?
      }
      if (turnCommand?.command === Command.BALL && this.fieldIndex) {
          this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true; //TODO: is the bang correct here?
      }
      this.end();
    });
  }
}
