import { globalScene } from "#app/battle-scene";
import { BattlePhase } from "./battle-phase";

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    globalScene.newBattle();

    this.end();
  }
}
