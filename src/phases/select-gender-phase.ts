import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Phase } from "#app/phase";
import { PlayerGender } from "#enums/player-gender";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectModeConfig } from "#types/ui-types";
import i18next from "i18next";

export class SelectGenderPhase extends Phase {
  public readonly phaseName = "SelectGenderPhase";

  public override start(): void {
    super.start();

    const { gameData, ui } = globalScene;

    const genderSelectConfig: OptionSelectModeConfig = {
      options: [
        {
          label: i18next.t("settings:boy"),
          handler: () => {
            settings.update("general", "playerGender", PlayerGender.MALE);
            gameData.saveSystem().then(() => this.end());
            return true;
          },
        },
        {
          label: i18next.t("settings:girl"),
          handler: () => {
            settings.update("general", "playerGender", PlayerGender.FEMALE);
            gameData.saveSystem().then(() => this.end());
            return true;
          },
        },
      ],
      inputDelay: 1000,
      blockCancelButton: true,
      yOffset: 48,
    };

    ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      ui.setMode(UiMode.OPTION_SELECT, genderSelectConfig);
    });
  }

  public override end(): void {
    globalScene.ui.setMode(UiMode.MESSAGE);
    super.end();
  }
}
