import BattleScene from "#app/battle-scene";
import { BattlePhase } from "./battle-phase";
import * as LoggerTools from "../logger";

export class HidePartyExpBarPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.partyExpBar.hide().then(() => this.end());
  }
}
