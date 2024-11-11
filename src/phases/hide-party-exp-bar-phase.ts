import { globalScene } from "#app/battle-scene";
import { BattlePhase } from "./battle-phase";

export class HidePartyExpBarPhase extends BattlePhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    globalScene.partyExpBar.hide().then(() => this.end());
  }
}
