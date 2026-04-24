import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { PlayerGender } from "#enums/player-gender";
import { UiMode } from "#enums/ui-mode";
import { settings } from "#system/settings-manager";
import i18next from "i18next";

export class SelectGenderPhase extends Phase {
  public readonly phaseName = "SelectGenderPhase";

  start(): void {
    super.start();

    globalScene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      globalScene.ui.setMode(UiMode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("settings:boy"),
            handler: () => {
              settings.update("general", "playerGender", PlayerGender.MALE);
              globalScene.gameData.saveSystem().then(() => this.end());
              return true;
            },
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              settings.update("general", "playerGender", PlayerGender.FEMALE);
              globalScene.gameData.saveSystem().then(() => this.end());
              return true;
            },
          },
        ],
      });
    });
  }

  end(): void {
    globalScene.ui.setMode(UiMode.MESSAGE);
    super.end();
  }
}
