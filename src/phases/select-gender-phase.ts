import { globalScene } from "#app/global-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { Phase } from "#app/phase";
import { SettingKeys } from "#app/system/settings/settings";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";

export class SelectGenderPhase extends Phase {
  constructor() {
    super();
  }

  start(): void {
    super.start();

    globalScene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      globalScene.ui.setMode(Mode.OPTION_SELECT, {
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
    globalScene.ui.setMode(Mode.MESSAGE);
    super.end();
  }
}
