import BattleScene from "#app/battle-scene";
import { CharacterGender } from "#app/enums/character-gender";
import { Phase } from "#app/phase";
import { SettingKeys } from "#app/system/settings/settings";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";

export class SelectRivalGenderPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.showText(i18next.t("menu:rivalBoyOrGirl"), null, () => {
      this.scene.ui.setMode(Mode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("settings:boy"),
            handler: () => {
              this.scene.gameData.gender = CharacterGender.MALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              this.scene.gameData.gender = CharacterGender.FEMALE;
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
