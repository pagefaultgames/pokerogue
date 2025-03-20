import { globalScene } from "#app/global-scene";

export class Phase {
  start() {}

  end() {
    globalScene.shiftPhase();
  }
}
