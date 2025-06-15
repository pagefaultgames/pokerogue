import { globalScene } from "#app/global-scene";
import { BattlePhase } from "./battle-phase";

export class NewBattlePhase extends BattlePhase {
  public readonly phaseName = "NewBattlePhase";
  start() {
    super.start();

    globalScene.phaseManager.removeAllPhasesOfType("NewBattlePhase");

    globalScene.newBattle();

    this.end();
  }
}
