import { globalScene } from "#app/global-scene";
import type { SettingsDisplayUiHandler } from "#ui/settings-display-ui-handler";
import i18next from "i18next";

const cancelHandler = () => {
  globalScene.ui.revertMode();
  const handler = globalScene.ui.getHandler();
  // Reset the cursor to the current language, if in the settings menu
  if (handler && typeof (handler as SettingsDisplayUiHandler).setOptionCursor === "function") {
    (handler as SettingsDisplayUiHandler).setOptionCursor(-1, 0, true);
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

export const languageOptions = [
  {
    label: "English",
    handler: () => changeLocaleHandler("en"),
  },
  {
    label: "Español (ES)",
    handler: () => changeLocaleHandler("es-ES"),
  },
  {
    label: "Español (LATAM)",
    handler: () => changeLocaleHandler("es-419"),
  },
  {
    label: "Français",
    handler: () => changeLocaleHandler("fr"),
  },
  {
    label: "Deutsch",
    handler: () => changeLocaleHandler("de"),
  },
  {
    label: "Italiano",
    handler: () => changeLocaleHandler("it"),
  },
  {
    label: "Português (BR)",
    handler: () => changeLocaleHandler("pt-BR"),
  },
  {
    label: "한국어",
    handler: () => changeLocaleHandler("ko"),
  },
  {
    label: "日本語",
    handler: () => changeLocaleHandler("ja"),
  },
  {
    label: "简体中文",
    handler: () => changeLocaleHandler("zh-Hans"),
  },
  {
    label: "繁體中文",
    handler: () => changeLocaleHandler("zh-Hant"),
  },
  {
    label: "Català (Needs Help)",
    handler: () => changeLocaleHandler("ca"),
  },
  {
    label: "Türkçe (Needs Help)",
    handler: () => changeLocaleHandler("tr"),
  },
  {
    label: "Русский (Needs Help)",
    handler: () => changeLocaleHandler("ru"),
  },
  {
    label: "Dansk (Needs Help)",
    handler: () => changeLocaleHandler("da"),
  },
  {
    label: "Română (Needs Help)",
    handler: () => changeLocaleHandler("ro"),
  },
  {
    label: "Tagalog (Needs Help)",
    handler: () => changeLocaleHandler("tl"),
  },
  {
    label: i18next.t("settings:back"),
    handler: () => cancelHandler(),
  },
];
