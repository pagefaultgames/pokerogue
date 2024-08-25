import { BattlePhase } from "./battle-phase";
import * as LoggerTools from "../logger";

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    this.scene.newBattle();

    this.end();
  }
}
