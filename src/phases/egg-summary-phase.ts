import { gScene } from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";
import { EggHatchData } from "#app/data/egg-hatch-data";

/**
 * Class that represents the egg summary phase
 * It does some of the function for updating egg data
 * Phase is handled mostly by the egg-hatch-scene-handler UI
 */
export class EggSummaryPhase extends Phase {
  private eggHatchData: EggHatchData[];

  constructor(eggHatchData: EggHatchData[]) {
    super();
    this.eggHatchData = eggHatchData;
  }

  start() {
    super.start();

    // updates next pokemon once the current update has been completed
    const updateNextPokemon = (i: number) => {
      if (i >= this.eggHatchData.length) {
        gScene.ui.setModeForceTransition(Mode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          gScene.fadeOutBgm(undefined, false);
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
    gScene.time.delayedCall(250, () => gScene.setModifiersVisible(true));
    gScene.ui.setModeForceTransition(Mode.MESSAGE).then(() => {
      super.end();
    });
  }
}
