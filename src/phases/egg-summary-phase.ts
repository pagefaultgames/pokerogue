import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { EggHatchData } from "./egg-hatch-phase";
import { Mode } from "#app/ui/ui.js";
import EggHatchSceneHandler from "#app/ui/egg-hatch-scene-handler.js";

export class EggSummaryPhase extends Phase {
  private eggHatchData: EggHatchData[];

  private eggHatchHandler: EggHatchSceneHandler;
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;

  constructor(scene: BattleScene, eggHatchData: EggHatchData[]) {
    super(scene);
    this.eggHatchData = eggHatchData;
  }

  start() {
    super.start();

    const updateNextPokemon = (i: integer) => {
      console.log(i);
      if (i >= this.eggHatchData.length) {
        console.log("displayed all pokemon");
        this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          this.scene.fadeOutBgm(undefined, false);
          this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

        });

      } else {
        this.eggHatchData[i].setDex();
        this.eggHatchData[i].updatePokemon().then(() => {
          console.log("updating next pokemon");
          if (i < this.eggHatchData.length) {
            updateNextPokemon(i + 1);
          }
        });
      }
    };
    updateNextPokemon(0);

  }

  end() {
    console.log("ended egg hatch summary phase");
    this.eggHatchHandler.clear();
    //   this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    super.end();
  }
}
