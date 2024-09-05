import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";

export class EndEvolutionPhase extends Phase {

  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}
