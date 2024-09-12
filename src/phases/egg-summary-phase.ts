import BattleScene from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";
import EggHatchSceneHandler from "#app/ui/egg-hatch-scene-handler";
import { EggHatchData } from "#app/data/egg-hatch-data";

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

    // updates next pokemon once the current update has been completed
    const updateNextPokemon = (i: number) => {
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
    this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => {
      super.end();
    });
  }
}
