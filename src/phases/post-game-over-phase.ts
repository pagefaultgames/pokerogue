import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { EndCardPhase } from "./end-card-phase";
import { TitlePhase } from "./title-phase";

export class PostGameOverPhase extends Phase {
  private endCardPhase?: EndCardPhase;

  constructor(endCardPhase?: EndCardPhase) {
    super();

    this.endCardPhase = endCardPhase;
  }

  start() {
    super.start();

    const saveAndReset = () => {
      globalScene.gameData.saveAll(true, true, true).then(success => {
        if (!success) {
          return globalScene.reset(true);
        }
        globalScene.gameData
          .tryClearSession(globalScene.sessionSlotId)
          .then((success: boolean | [boolean, boolean]) => {
            if (!success[0]) {
              return globalScene.reset(true);
            }
            globalScene.reset();
            globalScene.unshiftPhase(new TitlePhase());
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
