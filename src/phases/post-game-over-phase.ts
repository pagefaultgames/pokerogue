import BattleScene from "#app/battle-scene";
import { Phase } from "#app/phase";
import { EndCardPhase } from "./end-card-phase";
import { TitlePhase } from "./title-phase";
import * as LoggerTools from "../logger";

export class PostGameOverPhase extends Phase {
  private endCardPhase: EndCardPhase | null;

  constructor(scene: BattleScene, endCardPhase?: EndCardPhase) {
    super(scene);

    this.endCardPhase = endCardPhase!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    const saveAndReset = () => {
      this.scene.gameData.saveAll(this.scene, true, true, true).then(success => {
        if (!success) {
          return this.scene.reset(true);
        }
        this.scene.gameData.tryClearSession(this.scene, this.scene.sessionSlotId).then((success: boolean | [boolean, boolean]) => {
          if (!success[0]) {
            return this.scene.reset(true);
          }
          this.scene.reset();
          this.scene.unshiftPhase(new TitlePhase(this.scene));
          this.end();
        });
      });
    };

    if (this.endCardPhase) {
      this.scene.ui.fadeOut(500).then(() => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);

        this.endCardPhase?.endCard.destroy();
        this.endCardPhase?.text.destroy();
        saveAndReset();
      });
    } else {
      saveAndReset();
    }
  }
}
