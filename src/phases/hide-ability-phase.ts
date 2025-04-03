import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class HideAbilityPhase extends Phase {
  start() {
    super.start();

    globalScene.abilityBar.hide().then(() => {
      this.end();
    });
  }
}
