import { gScene } from "#app/battle-scene";
import { Phase } from "#app/phase";
import { Unlockables, getUnlockableName } from "#app/system/unlockables";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";

export class UnlockPhase extends Phase {
  private unlockable: Unlockables;

  constructor(unlockable: Unlockables) {
    super();

    this.unlockable = unlockable;
  }

  start(): void {
    gScene.time.delayedCall(2000, () => {
      gScene.gameData.unlocks[this.unlockable] = true;
      // Sound loaded into game as is
      gScene.playSound("level_up_fanfare");
      gScene.ui.setMode(Mode.MESSAGE);
      gScene.ui.showText(i18next.t("battle:unlockedSomething", { unlockedThing: getUnlockableName(this.unlockable) }), null, () => {
        gScene.time.delayedCall(1500, () => gScene.arenaBg.setVisible(true));
        this.end();
      }, null, true, 1500);
    });
  }
}
