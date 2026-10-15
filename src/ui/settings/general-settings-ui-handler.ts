import { eventBus } from "#app/event-bus";
import { globalScene } from "#app/global-scene";
import type { GeneralSettingsKey, SettingsUiItem } from "#types/settings";
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

  protected override handleSaveSetting<V = any>(uiItem: SettingsUiItem<GeneralSettingsKey>, newValue: V): void {
    if (uiItem.key === "moveTouchControls" && newValue) {
      eventBus.emit("touchControls/move/start");
      eventBus.once("touchControls/move/end", () => {
        this.setOptionCursor(-1, 0, false);
      });
      return;
    }

    super.handleSaveSetting(uiItem, newValue);
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
