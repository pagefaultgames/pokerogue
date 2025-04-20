import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import type { EggHatchData } from "#app/data/egg-hatch-data";

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
        globalScene.ui.setModeForceTransition(UiMode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          globalScene.fadeOutBgm(undefined, false);
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
    globalScene.time.delayedCall(250, () => globalScene.setModifiersVisible(true));
    globalScene.ui.setModeForceTransition(UiMode.MESSAGE).then(() => {
      super.end();
    });
  }
}
