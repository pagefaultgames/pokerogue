import { gScene } from "#app/battle-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { BattlePhase } from "./battle-phase";

export class ShowTrainerPhase extends BattlePhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.trainer.setVisible(true);

    gScene.trainer.setTexture(`trainer_${gScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    gScene.tweens.add({
      targets: gScene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end()
    });
  }
}
