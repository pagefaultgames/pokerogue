import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { FieldPhase } from "#phases/field-phase";
import i18next from "i18next";

export class LevelCapPhase extends FieldPhase {
  public readonly phaseName = "LevelCapPhase";

  public override async start(): Promise<void> {
    super.start();

    await globalScene.ui.setMode(UiMode.MESSAGE);
    audioManager.playSound("se/level_up_fanfare");

    await globalScene.ui.showTextPromise(i18next.t("battle:levelCapUp", { levelCap: globalScene.getMaxExpLevel() }));
    this.executeForAll(pokemon => pokemon.updateInfo(true));
    this.end();
  }
}
