import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";

export class SelectChallengePhase extends Phase {
  start() {
    super.start();

    globalScene.playBgm("menu");

    globalScene.ui.setMode(UiMode.CHALLENGE_SELECT);
  }
}
