import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { CommandPhase } from "./command-phase";
import { PokemonPhase } from "./pokemon-phase";

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
