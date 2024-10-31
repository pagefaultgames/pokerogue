import { gScene } from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";

export class EndEvolutionPhase extends Phase {

  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}
