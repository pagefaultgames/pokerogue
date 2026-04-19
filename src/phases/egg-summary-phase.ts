import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { EggHatchData } from "#data/egg-hatch-data";
import { UiMode } from "#enums/ui-mode";

/**
 * Class that represents the egg summary phase
 * It does some of the function for updating egg data
 * Phase is handled mostly by the egg-hatch-scene-handler UI
 */
export class EggSummaryPhase extends Phase {
  public readonly phaseName = "EggSummaryPhase";
  private eggHatchData: EggHatchData[];

  constructor(eggHatchData: EggHatchData[]) {
    super();
    this.eggHatchData = eggHatchData;
  }

  public override async start(): Promise<void> {
    super.start();

    for (const eggHatchData of this.eggHatchData) {
      eggHatchData.setDex();
      await eggHatchData.updatePokemon();
    }

    await globalScene.ui.setModeForceTransition(UiMode.EGG_HATCH_SUMMARY, this.eggHatchData);
    globalScene.fadeOutBgm(undefined, false);
  }

  public override end(): void {
    this.eggHatchData.forEach(data => {
      data.pokemon?.destroy();
    });
    this.eggHatchData = [];
    globalScene.time.delayedCall(250, () => globalScene.setModifiersVisible(true));
    globalScene.ui.setModeForceTransition(UiMode.MESSAGE).then(() => {
      super.end();
    });
  }
}
