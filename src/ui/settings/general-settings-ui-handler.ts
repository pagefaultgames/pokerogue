import { globalScene } from "#app/global-scene";
import { BaseSettingsUiHandler } from "#ui/base-settings-ui-handler";
import { generalSettingsUiItems } from "#ui/settings-ui-items";
import { hasTouchscreen, isLandscapeMode } from "#utils/app-utils";
import { t } from "i18next";

export class GeneralSettingsUiHandler extends BaseSettingsUiHandler {
  constructor() {
    super("general", generalSettingsUiItems);

    window.addEventListener("resize", () => {
      this.updateMoveTouchControlsSettingsLabel();
    });
  }

  public override show(args: any[]): boolean {
    const ret = super.show(args);

    this.updateMoveTouchControlsSettingsLabel();

    return ret;
  }

  private updateMoveTouchControlsSettingsLabel(): void {
    if (!hasTouchscreen()) {
      return;
    }

    const settingIndex = this.uiItems.findIndex(uiItem => uiItem.key === "moveTouchControls");
    if (settingIndex === -1) {
      console.warn("Could not find `moveTouchControls` setting label!");
    }

    this.updateOptionValueLabel(
      settingIndex,
      0,
      isLandscapeMode(globalScene) ? t("settings:landscape") : t("settings:portrait"),
    );
  }
}
