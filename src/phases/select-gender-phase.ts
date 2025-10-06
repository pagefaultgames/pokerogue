import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { PlayerGender } from "#enums/player-gender";
import { UiMode } from "#enums/ui-mode";
import { SettingKeys } from "#system/settings";
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
              globalScene.gameData.gender = PlayerGender.MALE;
              globalScene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              globalScene.gameData.saveSystem().then(() => this.end());
              return true;
            },
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              globalScene.gameData.gender = PlayerGender.FEMALE;
              globalScene.gameData.saveSetting(SettingKeys.Player_Gender, 1);
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
