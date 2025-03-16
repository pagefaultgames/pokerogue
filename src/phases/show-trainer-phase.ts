import { globalScene } from "#app/global-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { BattlePhase } from "./battle-phase";

export class ShowTrainerPhase extends BattlePhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    globalScene.trainer.setVisible(true);

    globalScene.trainer.setTexture(`trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    globalScene.tweens.add({
      targets: globalScene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end(),
    });
  }
}
