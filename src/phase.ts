import { gScene } from "./battle-scene";

export class Phase {
  start() {
    if (gScene.abilityBar.shown) {
      gScene.abilityBar.resetAutoHideTimer();
    }
  }

  end() {
    gScene.shiftPhase();
  }
}
