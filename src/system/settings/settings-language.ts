import { globalScene } from "#app/global-scene";
import { supportedLngs } from "#plugins/i18n";
import type { LoginRegisterInfoContainerUiHandler } from "#ui/login-register-info-container-ui-handler";
import type { SettingsDisplayUiHandler } from "#ui/settings-display-ui-handler";
import i18next from "i18next";

const cancelHandler = () => {
  globalScene.ui.revertMode();
  const handler = globalScene.ui.getHandler();
  // Reset the cursor to the current language, if in the settings menu
  if (handler && typeof (handler as SettingsDisplayUiHandler).setOptionCursor === "function") {
    (handler as SettingsDisplayUiHandler).setOptionCursor(-1, 0, true);
  } else if (handler && typeof (handler as LoginRegisterInfoContainerUiHandler).setInteractive === "function") {
    (handler as LoginRegisterInfoContainerUiHandler).setInteractive(true);
  }
};

const changeLocaleHandler = (locale: string): boolean => {
  try {
    i18next.changeLanguage(locale);
    localStorage.setItem("prLang", locale);
    cancelHandler();
    // Reload the whole game to apply the new locale since also some constants are translated
    window.location.reload();
    return true;
  } catch (error) {
    console.error("Error changing locale:", error);
    return false;
  }
};

type Lang = { [name: string]: () => boolean };
const languageEntries: Lang[] = [];

// populating languageEntries
for (const lang in supportedLngs) {
  const label = supportedLngs[lang];
  languageEntries.push({
    label,
    handler: () => changeLocaleHandler(lang),
  });
}

export const languageOptions = [
  ...languageEntries,
  {
    label: i18next.t("settings:back"),
    handler: () => cancelHandler(),
  },
];
