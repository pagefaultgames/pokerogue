import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";
import { fixedInt } from "#app/utils";

export class ReloadSessionPhase extends Phase {
  private systemDataStr?: string;

  constructor(systemDataStr?: string) {
    super();

    this.systemDataStr = systemDataStr;
  }

  start(): void {
    globalScene.ui.setMode(Mode.SESSION_RELOAD);

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
