import { gScene } from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";

export class LevelCapPhase extends FieldPhase {
  constructor() {
    super();
  }

  start(): void {
    super.start();

    gScene.ui.setMode(Mode.MESSAGE).then(() => {
      // Sound loaded into game as is
      gScene.playSound("level_up_fanfare");
      gScene.ui.showText(i18next.t("battle:levelCapUp", { levelCap: gScene.getMaxExpLevel() }), null, () => this.end(), null, true);
      this.executeForAll(pokemon => pokemon.updateInfo(true));
    });
  }
}
