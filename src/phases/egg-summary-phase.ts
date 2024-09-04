import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";
import EggHatchSceneHandler from "#app/ui/egg-hatch-scene-handler.js";
import { EggHatchData } from "#app/data/egg-hatch-data.js";

/**
 * Class that represents the egg summary phase
 * It does some of the function for updating egg data
 * Phase is handled mostly by the egg-hatch-scene-handler UI
 */
export class EggSummaryPhase extends Phase {
  private eggHatchData: EggHatchData[];

  private eggHatchHandler: EggHatchSceneHandler;

  constructor(scene: BattleScene, eggHatchData: EggHatchData[]) {
    super(scene);
    this.eggHatchData = eggHatchData;
  }

  start() {
    super.start();

    const updateNextPokemon = (i: integer) => {
      if (i >= this.eggHatchData.length) {

        this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          this.scene.fadeOutBgm(undefined, false);
          this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

        });

      } else {
        this.eggHatchData[i].setDex();
        this.eggHatchData[i].updatePokemon().then(() => {
          if (i < this.eggHatchData.length) {
            updateNextPokemon(i + 1);
          }
        });
      }
    };
    updateNextPokemon(0);

  }

  end() {
    this.eggHatchHandler.clear();
    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => {
    });
    super.end();
  }
}
