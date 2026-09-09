import { globalScene } from "#app/global-scene";
import { LANGUAGE_MAX_OPTIONS } from "#constants/app-constants";
import { UiMode } from "#enums/ui-mode";
import { SUPPORTED_LANGUAGE_ENTRIES, type SupportedLanguage } from "#system/supported-languages";
import type { DisplaySettingsKey, SettingsUiItem } from "#types/settings";
import type { OptionSelectItem } from "#types/ui-types";
import { BaseSettingsUiHandler } from "#ui/base-settings-ui-handler";
import { displaySettingUiItems } from "#ui/settings-ui-items";
import i18next from "i18next";

export class SettingsDisplayUiHandler extends BaseSettingsUiHandler {
  constructor() {
    super("display", displaySettingUiItems);
  }

  protected override handleSaveSetting<V = any>(uiItem: SettingsUiItem<DisplaySettingsKey>, newValue: V): void {
    if (uiItem.key === "language" && newValue) {
      this.displayLanguageOptions();
      return;
    }

    super.handleSaveSetting(uiItem, newValue);
  }

  private displayLanguageOptions(): void {
    const options: OptionSelectItem[] = [];

    for (const [lang, props] of Object.entries(SUPPORTED_LANGUAGE_ENTRIES)) {
      if (lang === i18next.resolvedLanguage) {
        continue;
      }

      const label = props.label;

      const handler = (): boolean => {
        if (this.canLoseProgress()) {
          this.showConfirm(
            i18next.t("menuUiHandler:losingProgressionWarning"),
            () => this.changeLanguageHandler(lang, label),
            () => this.cancelLanguageChangeHandler(),
          );
          return true;
        }
        return this.changeLanguageHandler(lang, label);
      };

      options.push({ label, handler });
    }

    options.push({
      label: i18next.t("settings:back"),
      handler: () => this.cancelLanguageChangeHandler(),
    });

    globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, { options, maxOptions: LANGUAGE_MAX_OPTIONS });
  }

  private cancelLanguageChangeHandler(): boolean {
    this.setOptionCursor(0, 0);
    globalScene.ui.revertMode();
    return true;
  }

  private changeLanguageHandler(lang: SupportedLanguage, label: string): boolean {
    i18next.changeLanguage(lang);
    this.setOptionCursor(0, 0);
    this.updateOptionValueLabel(0, 0, label);
    // Reloading the whole page is necessary to apply the new locales
    // due to various static elements being translated
    window.location.reload();
    return true;
  }
}
