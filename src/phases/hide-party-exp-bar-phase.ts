import { globalScene } from "#app/global-scene";
import { BattlePhase } from "./battle-phase";

export class HidePartyExpBarPhase extends BattlePhase {
  public readonly phaseName = "HidePartyExpBarPhase";
  start() {
    super.start();

    globalScene.partyExpBar.hide().then(() => this.end());
  }
}
