import { gScene } from "#app/battle-scene";
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

    gScene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      gScene.ui.setMode(Mode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("settings:boy"),
            handler: () => {
              gScene.gameData.gender = PlayerGender.MALE;
              gScene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              gScene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              gScene.gameData.gender = PlayerGender.FEMALE;
              gScene.gameData.saveSetting(SettingKeys.Player_Gender, 1);
              gScene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          }
        ]
      });
    });
  }

  end(): void {
    gScene.ui.setMode(Mode.MESSAGE);
    super.end();
  }
}
