import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import type { Unlockables } from "#enums/unlockables";
import { getUnlockableName } from "#system/unlockables";
import i18next from "i18next";

export class UnlockPhase extends Phase {
  public readonly phaseName = "UnlockPhase";
  private unlockable: Unlockables;

  constructor(unlockable: Unlockables) {
    super();

    this.unlockable = unlockable;
  }

  start(): void {
    globalScene.time.delayedCall(2000, () => {
      globalScene.gameData.unlocks[this.unlockable] = true;
      // Sound loaded into game as is
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.showText(
        i18next.t("battle:unlockedSomething", {
          unlockedThing: getUnlockableName(this.unlockable),
        }),
        null,
        () => {
          globalScene.time.delayedCall(1500, () => globalScene.arenaBg.setVisible(true));
          this.end();
        },
        null,
        true,
        1500,
      );
    });
  }
}
