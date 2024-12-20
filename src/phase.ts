import { globalScene } from "#app/global-scene";

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
