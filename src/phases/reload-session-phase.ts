import { gScene } from "#app/battle-scene";
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
    gScene.ui.setMode(Mode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    gScene.time.delayedCall(Utils.fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    gScene.gameData.clearLocalData();

    (this.systemDataStr ? gScene.gameData.initSystem(this.systemDataStr) : gScene.gameData.loadSystem()).then(() => {
      if (delayElapsed) {
        this.end();
      } else {
        loaded = true;
      }
    });
  }
}
