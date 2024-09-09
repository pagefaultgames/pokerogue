import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { Mode } from "#app/ui/ui.js";
import * as Utils from "#app/utils.js";

export class ReloadSessionPhase extends Phase {
  private systemDataStr: string | null;

  constructor(scene: BattleScene, systemDataStr?: string) {
    super(scene);

    this.systemDataStr = systemDataStr ?? null;
  }

  start(): void {
    this.scene.ui.setMode(Mode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    this.scene.gameData.clearLocalData();

    (this.systemDataStr ? this.scene.gameData.initSystem(this.systemDataStr) : this.scene.gameData.loadSystem()).then(() => {
      if (delayElapsed) {
        this.end();
      } else {
        loaded = true;
      }
    });
  }
}
