import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";

export class OutdatedPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.OUTDATED);
  }
}
