import BattleScene from "./battle-scene";
import {NewBattlePhase} from "#app/phases";

export class Phase {
  protected scene: BattleScene;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }

  start() {
    console.log(`%cStart Phase ${this.constructor.name}`, "color:green;");
    if (this.scene.abilityBar.shown) {
      this.scene.abilityBar.resetAutoHideTimer();
    }
  }

  end() {
    if (this.scene.phaseQueue?.length && this.scene.phaseQueue[0] instanceof NewBattlePhase) {
      throw new Error("tayo");
    }
    this.scene.shiftPhase();
  }
}
