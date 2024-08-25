import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";

export class SelectChallengePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playBgm("menu");

    this.scene.ui.setMode(Mode.CHALLENGE_SELECT);
  }
}
