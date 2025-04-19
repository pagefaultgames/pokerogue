import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import { LoginPhase } from "./login-phase";

export class UnavailablePhase extends Phase {
  start(): void {
    globalScene.ui.setMode(UiMode.UNAVAILABLE, () => {
      globalScene.unshiftPhase(new LoginPhase(true));
      this.end();
    });
  }
}
