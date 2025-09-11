import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { EndCardPhase } from "#phases/end-card-phase";

export class PostGameOverPhase extends Phase {
  public readonly phaseName = "PostGameOverPhase";
  private endCardPhase?: EndCardPhase;
  private slotId: number;

  constructor(slotId: number, endCardPhase?: EndCardPhase) {
    super();
    this.slotId = slotId;
    this.endCardPhase = endCardPhase;
  }

  start() {
    super.start();

    const saveAndReset = () => {
      globalScene.gameData.saveAll(true, true, true).then(success => {
        if (!success) {
          return globalScene.reset(true);
        }
        globalScene.gameData.tryClearSession(this.slotId).then((success: boolean | [boolean, boolean]) => {
          if (!success[0]) {
            return globalScene.reset(true);
          }
          globalScene.reset();
          globalScene.phaseManager.unshiftNew("TitlePhase");
          this.end();
        });
      });
    };

    if (this.endCardPhase) {
      globalScene.ui.fadeOut(500).then(() => {
        globalScene.ui.getMessageHandler().bg.setVisible(true);

        this.endCardPhase?.endCard.destroy();
        this.endCardPhase?.text.destroy();
        saveAndReset();
      });
    } else {
      saveAndReset();
    }
  }
}
