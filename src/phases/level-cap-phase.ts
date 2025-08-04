import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { FieldPhase } from "#phases/field-phase";
import i18next from "i18next";

export class LevelCapPhase extends FieldPhase {
  public readonly phaseName = "LevelCapPhase";
  start(): void {
    super.start();

    globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
      // Sound loaded into game as is
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.showText(
        i18next.t("battle:levelCapUp", {
          levelCap: globalScene.getMaxExpLevel(),
        }),
        null,
        () => this.end(),
        null,
        true,
      );
      this.executeForAll(pokemon => pokemon.updateInfo(true));
    });
  }
}
