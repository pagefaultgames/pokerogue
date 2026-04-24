import { globalScene } from "#app/global-scene";
import { BattlePhase } from "#phases/battle-phase";
import { settings } from "#system/settings-manager";

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
