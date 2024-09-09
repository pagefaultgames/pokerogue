import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";
import { LoginPhase } from "./login-phase";

export class UnavailablePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.UNAVAILABLE, () => {
      this.scene.unshiftPhase(new LoginPhase(this.scene, true));
      this.end();
    });
  }
}
