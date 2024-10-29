import BattleScene from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";

export class EndEvolutionPhase extends Phase {

  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}
