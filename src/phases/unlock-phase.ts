import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Unlockables, getUnlockableName } from "#app/system/unlockables.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";

export class UnlockPhase extends Phase {
  private unlockable: Unlockables;

  constructor(scene: BattleScene, unlockable: Unlockables) {
    super(scene);

    this.unlockable = unlockable;
  }

  start(): void {
    this.scene.time.delayedCall(2000, () => {
      this.scene.gameData.unlocks[this.unlockable] = true;
      // Sound loaded into game as is
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.setMode(Mode.MESSAGE);
      this.scene.ui.showText(i18next.t("battle:unlockedSomething", { unlockedThing: getUnlockableName(this.unlockable) }), null, () => {
        this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
        this.end();
      }, null, true, 1500);
    });
  }
}
