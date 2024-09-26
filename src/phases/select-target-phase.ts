import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { CommandPhase, targIDs } from "./command-phase";
import { PokemonPhase } from "./pokemon-phase";
import * as LoggerTools from "../logger";
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
      // Reject player's target selection
      if (moveObject && user.isMoveTargetRestricted(moveObject.id, user, fieldSide[targets[0]])) {
        const errorMessage = user.getRestrictingTag(move!, user, fieldSide[targets[0]])!.selectionDeniedText(user, moveObject.id);
        user.scene.queueMessage(i18next.t(errorMessage, { moveName: moveObject.name }), 0, true);
        targets = [];
      }
      // Cancel this action
      if (targets.length < 1) {
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        LoggerTools.Actions[this.fieldIndex] = "";
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else {
        turnCommand!.targets = targets; //TODO: is the bang correct here?
        LoggerTools.Actions[this.fieldIndex] += " " + this.formatTargets(targets, this.fieldIndex)
      }
      if (turnCommand?.command === Command.BALL && this.fieldIndex) {
        this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true; //TODO: is the bang correct here?
      }
      this.end();
    });
  }

  /**
   * Formats an attack's targets.
   * @param indices The `BattlerIndex` of all targets
   * @param fieldIndex The `BattlerIndex` of the user
   */
  formatTargets(indices: BattlerIndex[], fieldIndex: BattlerIndex) {
    var output: string[] = [];
    for (var i = 0; i < indices.length; i++) {
      var selection = "";
      if (fieldIndex < 2) {
        // Player
        selection = targIDs[indices[i] + 1];
      } else {
        // Enemy
        selection = targIDs[indices[i] + 3];
      }
      // If this Pokémon is on the right side of the field, flip the terms 'self' and 'ally'
      if (selection == "Self" && fieldIndex % 2 == 1) {
        selection = "Ally"
      }
      if (selection == "Ally" && fieldIndex % 2 == 1) {
        selection = "Self"
      }
    }
    return "→ " + output.join(", ");
  }
}
