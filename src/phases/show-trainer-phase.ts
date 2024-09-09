import BattleScene from "#app/battle-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { BattlePhase } from "./battle-phase";
import * as LoggerTools from "../logger";

export class ShowTrainerPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.trainer.setVisible(true);

    this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    this.scene.tweens.add({
      targets: this.scene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end()
    });
  }
}
