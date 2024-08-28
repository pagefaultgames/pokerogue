import BattleScene from "#app/battle-scene.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { BattlePhase } from "./battle-phase";

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
