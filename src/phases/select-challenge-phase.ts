import { gScene } from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";

export class SelectChallengePhase extends Phase {
  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.playBgm("menu");

    gScene.ui.setMode(Mode.CHALLENGE_SELECT);
  }
}
