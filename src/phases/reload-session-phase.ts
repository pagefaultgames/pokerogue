import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import { fixedInt } from "#utils/common";

export class ReloadSessionPhase extends Phase {
  public readonly phaseName = "ReloadSessionPhase";
  private systemDataStr?: string;

  constructor(systemDataStr?: string) {
    super();

    this.systemDataStr = systemDataStr;
  }

  start(): void {
    globalScene.ui.setMode(UiMode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    globalScene.time.delayedCall(fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    globalScene.gameData.clearLocalData();

    (this.systemDataStr ? globalScene.gameData.initSystem(this.systemDataStr) : globalScene.gameData.loadSystem()).then(
      () => {
        if (delayElapsed) {
          this.end();
        } else {
          loaded = true;
        }
      },
    );
  }
}
