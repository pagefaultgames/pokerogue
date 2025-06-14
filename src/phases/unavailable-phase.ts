import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";

export class UnavailablePhase extends Phase {
  public readonly phaseName = "UnavailablePhase";
  start(): void {
    globalScene.ui.setMode(UiMode.UNAVAILABLE, () => {
      globalScene.phaseManager.unshiftNew("LoginPhase", true);
      this.end();
    });
  }
}
