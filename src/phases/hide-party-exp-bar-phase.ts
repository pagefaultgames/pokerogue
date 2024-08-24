import BattleScene from "#app/battle-scene.js";
import { BattlePhase } from "./battle-phase";

export class HidePartyExpBarPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.partyExpBar.hide().then(() => this.end());
  }
}
