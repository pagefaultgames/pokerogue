import BattleScene from "#app/battle-scene.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { Phase } from "#app/phase.js";
import { SettingKeys } from "#app/system/settings/settings.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";

export class SelectGenderPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      this.scene.ui.setMode(Mode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("settings:boy"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.MALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.FEMALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 1);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          }
        ]
      });
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);
    super.end();
  }
}
