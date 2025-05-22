import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";

export class EndEvolutionPhase extends Phase {
  protected readonly phaseName = "EndEvolutionPhase";
  start() {
    super.start();

    globalScene.ui.setModeForceTransition(UiMode.MESSAGE).then(() => this.end());
  }
}
