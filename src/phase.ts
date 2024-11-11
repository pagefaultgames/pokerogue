import { globalScene } from "./battle-scene";

export class Phase {
  start() {
    if (globalScene.abilityBar.shown) {
      globalScene.abilityBar.resetAutoHideTimer();
    }
  }

  end() {
    globalScene.shiftPhase();
  }
}
