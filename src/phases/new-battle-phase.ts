import { gScene } from "#app/battle-scene";
import { BattlePhase } from "./battle-phase";

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    gScene.newBattle();

    this.end();
  }
}
