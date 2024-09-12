import BattleScene from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";

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
