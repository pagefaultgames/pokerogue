import { gScene } from "#app/battle-scene";
import { BattlePhase } from "./battle-phase";

export class HidePartyExpBarPhase extends BattlePhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.partyExpBar.hide().then(() => this.end());
  }
}
