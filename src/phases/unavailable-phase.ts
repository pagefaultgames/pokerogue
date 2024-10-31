import { gScene } from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";
import { LoginPhase } from "./login-phase";

export class UnavailablePhase extends Phase {
  constructor() {
    super();
  }

  start(): void {
    gScene.ui.setMode(Mode.UNAVAILABLE, () => {
      gScene.unshiftPhase(new LoginPhase(true));
      this.end();
    });
  }
}
