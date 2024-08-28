import { BattlePhase } from "./battle-phase";

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    this.scene.newBattle();

    this.end();
  }
}
