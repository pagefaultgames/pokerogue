import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { BattlePhase } from "#phases/battle-phase";

export class ShowTrainerPhase extends BattlePhase {
  public readonly phaseName = "ShowTrainerPhase";
  start() {
    super.start();

    globalScene.trainer.setVisible(true).setTexture(`trainer_${settings.isPlayerFemale ? "f" : "m"}_back`);

    globalScene.tweens.add({
      targets: globalScene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end(),
    });
  }
}
