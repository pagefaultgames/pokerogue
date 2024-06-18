import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import processor, { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";

import { deConfig } from "#app/locales/de/config.js";
import { enConfig } from "#app/locales/en/config.js";
import { esConfig } from "#app/locales/es/config.js";
import { frConfig } from "#app/locales/fr/config.js";
import { itConfig } from "#app/locales/it/config.js";
import { koConfig } from "#app/locales/ko/config.js";
import { ptBrConfig } from "#app/locales/pt_BR/config.js";
import { zhCnConfig } from "#app/locales/zh_CN/config.js";
import { zhTwConfig } from "#app/locales/zh_TW/config.js";

const fonts = [
  new FontFace("emerald", "url(./fonts/PokePT_Wansung.ttf)", { unicodeRange: "U+AC00-D7AC"}),
  Object.assign(
    new FontFace("pkmnems", "url(./fonts/PokePT_Wansung.ttf)", { unicodeRange: "U+AC00-D7AC"}),
    { sizeAdjust: "133%" }
  ),
];

async function initFonts() {
  const results = await Promise.allSettled(fonts.map(font => font.load()));
  for (const result of results) {
    if (result.status === "fulfilled") {
      document.fonts?.add(result.value);
    } else {
      console.error(result.reason);
    }
  }
}

export async function initI18n(): Promise<void> {
  // Prevent reinitialization
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  /**
   * i18next is a localization library for maintaining and using translation resources.
   *
   * Q: How do I add a new language?
   * A: To add a new language, create a new folder in the locales directory with the language code.
   *    Each language folder should contain a file for each namespace (ex. menu.ts) with the translations.
   *    Don't forget to declare new language in `supportedLngs` i18next initializer
   *
   * Q: How do I add a new namespace?
   * A: To add a new namespace, create a new file in each language folder with the translations.
   *    Then update the config file for that language in its locale directory
   *    and the CustomTypeOptions interface in the @types/i18next.d.ts file.
   *
   * Q: How do I make a language selectable in the settings?
   * A: In src/system/settings.ts, add a new case to the Setting.Language switch statement.
   */

  i18next.use(LanguageDetector);
  i18next.use(processor);
  i18next.use(new KoreanPostpositionProcessor());
  await i18next.init({
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "it", "de", "zh", "pt", "ko"],
    defaultNS: "menu",
    ns: Object.keys(enConfig),
    detection: {
      lookupLocalStorage: "prLang"
    },
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        ...enConfig
      },
      es: {
        ...esConfig
      },
      fr: {
        ...frConfig
      },
      it: {
        ...itConfig
      },
      de: {
        ...deConfig
      },
      "pt-BR": {
        ...ptBrConfig
      },
      "zh-CN": {
        ...zhCnConfig
      },
      "zh-TW": {
        ...zhTwConfig
      },
      ko: {
        ...koConfig
      },
    },
    postProcess: ["korean-postposition"],
  });

  await initFonts();
}

export default i18next;

export function getIsInitialized(): boolean {
  return isInitialized;
}

let isInitialized = false;

