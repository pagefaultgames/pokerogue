import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import type { Unlockables } from "#enums/unlockables";
import { getUnlockableName } from "#system/unlockables";
import i18next from "i18next";

export class UnlockPhase extends Phase {
  public readonly phaseName = "UnlockPhase";

  private readonly unlockable: Unlockables;

  constructor(unlockable: Unlockables) {
    super();

    this.unlockable = unlockable;
  }

  public override start(): void {
    globalScene.time.delayedCall(2000, () => {
      globalScene.gameData.unlocks[this.unlockable] = true;

      audioManager.playSound("se/level_up_fanfare");

      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.showText(
        i18next.t("battle:unlockedSomething", {
          unlockedThing: getUnlockableName(this.unlockable),
        }),
        {
          callback: () => {
            globalScene.time.delayedCall(1500, () => globalScene.arenaBg.setVisible(true));
            this.end();
          },
          prompt: true,
          promptDelay: 1500,
        },
      );
    });
  }
}
