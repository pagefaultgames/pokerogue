import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { Mode } from "#app/ui/ui";
import * as Utils from "#app/utils";

export class ReloadSessionPhase extends Phase {
  private systemDataStr: string | null;

  constructor(systemDataStr?: string) {
    super();

    this.systemDataStr = systemDataStr ?? null;
  }

  start(): void {
    globalScene.ui.setMode(Mode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    globalScene.time.delayedCall(Utils.fixedInt(1500), () => {
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
