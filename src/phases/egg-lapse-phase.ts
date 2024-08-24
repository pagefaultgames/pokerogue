import BattleScene from "#app/battle-scene.js";
import { Egg } from "#app/data/egg.js";
import { Phase } from "#app/phase.js";
import i18next from "i18next";
import Overrides from "#app/overrides";
import { EggHatchPhase } from "./egg-hatch-phase";

export class EggLapsePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const eggsToHatch: Egg[] = this.scene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
    });

    let eggCount: integer = eggsToHatch.length;

    if (eggCount) {
      this.scene.queueMessage(i18next.t("battle:eggHatching"));

      for (const egg of eggsToHatch) {
        this.scene.unshiftPhase(new EggHatchPhase(this.scene, egg, eggCount));
        if (eggCount > 0) {
          eggCount--;
        }
      }

    }
    this.end();
  }
}
