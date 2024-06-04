import i18next, { InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import processor, { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";

import { config as deConfig } from "#app/locales/de/config.js";
import { config as enConfig} from "#app/locales/en/config.js";
import { config as esConfig} from "#app/locales/es/config.js";
import { config as frConfig} from "#app/locales/fr/config.js";
import { config as itConfig} from "#app/locales/it/config.js";
import { config as koConfig} from "#app/locales/ko/config.js";
import { config as ptBrConfig} from "#app/locales/pt_BR/config.js";
import { config as zhCnConfig} from "#app/locales/zh_CN/config.js";
import { config as zhTwConfig} from "#app/locales/zh_TW/config.js";

export interface SimpleTranslationEntries {
  [key: string]: string
}

export interface MoveTranslationEntry {
  name: string,
  effect: string
}

export interface MoveTranslationEntries {
  [key: string]: MoveTranslationEntry
}

export interface AbilityTranslationEntry {
  name: string,
  description: string
}

export interface AbilityTranslationEntries {
  [key: string]: AbilityTranslationEntry
}

export interface ModifierTypeTranslationEntry {
  name?: string,
  description?: string,
  extra?: SimpleTranslationEntries
}

export interface ModifierTypeTranslationEntries {
  ModifierType: { [key: string]: ModifierTypeTranslationEntry },
  AttackTypeBoosterItem: SimpleTranslationEntries,
  TempBattleStatBoosterItem: SimpleTranslationEntries,
  BaseStatBoosterItem: SimpleTranslationEntries,
  EvolutionItem: SimpleTranslationEntries,
  FormChangeItem: SimpleTranslationEntries,
}
export interface PokemonInfoTranslationEntries {
  Stat: SimpleTranslationEntries,
  Type: SimpleTranslationEntries,
}

export interface BerryTranslationEntry {
  name: string,
  effect: string,
}

export interface BerryTranslationEntries {
  [key: string]: BerryTranslationEntry
}

export interface AchievementTranslationEntry {
  name?: string,
  description?: string,
}

export interface AchievementTranslationEntries {
  [key: string]: AchievementTranslationEntry;
}

export interface DialogueTranslationEntry {
  [key: number]: string;
}

export interface DialogueTranslationCategory {
  [category: string]: DialogueTranslationEntry;
}

export interface DialogueTranslationEntries {
  [trainertype: string]: DialogueTranslationCategory;
}


export interface Localizable {
  localize(): void;
}

const getAlternativeFonts = () => ({
  "ko": [
    new FontFace("emerald", "url(./fonts/PokePT_Wansung.ttf)"),
  ],
});

function loadFont(language: string) {
  const alternativeFonts = getAlternativeFonts();
  if (!alternativeFonts[language]) {
    language = language.split(/[-_/]/)[0];
  }
  if (alternativeFonts[language]) {
    alternativeFonts[language].forEach((fontFace: FontFace) => {
      document.fonts.add(fontFace);
    });

    const altFontLanguages = Object.keys(alternativeFonts);
    altFontLanguages.splice(altFontLanguages.indexOf(language), 0);
  }

  (Object.values(alternativeFonts)).forEach(fontFaces => {
    fontFaces.forEach(fontFace => {
      if (fontFace && fontFace.status === "loaded") {
        document.fonts.delete(fontFace);
      }
    });
  });
}

const isRunningInBrowser = typeof window !== "undefined";

export const resources = {
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
  pt_BR: {
    ...ptBrConfig
  },
  zh_CN: {
    ...zhCnConfig
  },
  zh_TW: {
    ...zhTwConfig
  },
  ko: {
    ...koConfig
  },
};

export function initI18n(): void {
  // Prevent reinitialization
  if (isInitialized) {
    return;
  }
  isInitialized = true;
  let lang = "";

  if (isRunningInBrowser && "FontFace" in window) {
    if (localStorage.getItem("prLang")) {
      lang = localStorage.getItem("prLang");
    }

    loadFont(lang);
    i18next.on("languageChanged", lng=> {
      loadFont(lng);
    });
  }

  const i18nextConfig = {
    lng: lang,
    nonExplicitSupportedLngs: true,
    fallbackLng: isRunningInBrowser ? "en" : false,
    supportedLngs: ["en", "es", "fr", "it", "de", "zh", "pt", "ko"],
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: resources
  };

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
   *    Then update the `resources` field in the init() call and the CustomTypeOptions interface.
   *
   * Q: How do I make a language selectable in the settings?
   * A: In src/system/settings.ts, add a new case to the Setting.Language switch statement.
   */
  if (isRunningInBrowser) {
    i18nextConfig["postProcess"] = ["korean-postposition"];
    i18next.use(LanguageDetector).use(processor).use(new KoreanPostpositionProcessor()).init(i18nextConfig as InitOptions);
  } else {
    i18next.use(LanguageDetector).init(i18nextConfig as InitOptions);
  }
}

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "menu"; // Even if we don't use it, i18next requires a valid default namespace
    resources: {
      menu: SimpleTranslationEntries;
      menuUiHandler: SimpleTranslationEntries;
      move: MoveTranslationEntries;
      battle: SimpleTranslationEntries;
      abilityTriggers: SimpleTranslationEntries;
      ability: AbilityTranslationEntries;
      pokeball: SimpleTranslationEntries;
      pokemon: SimpleTranslationEntries;
      pokemonInfo: PokemonInfoTranslationEntries;
      commandUiHandler: SimpleTranslationEntries;
      fightUiHandler: SimpleTranslationEntries;
      titles: SimpleTranslationEntries;
      trainerClasses: SimpleTranslationEntries;
      trainerNames: SimpleTranslationEntries;
      tutorial: SimpleTranslationEntries;
      starterSelectUiHandler: SimpleTranslationEntries;
      splashMessages: SimpleTranslationEntries;
      nature: SimpleTranslationEntries;
      growth: SimpleTranslationEntries;
      egg: SimpleTranslationEntries;
      weather: SimpleTranslationEntries;
      modifierType: ModifierTypeTranslationEntries;
      battleMessageUiHandler: SimpleTranslationEntries;
      berry: BerryTranslationEntries;
      achv: AchievementTranslationEntries;
      gameStatsUiHandler: SimpleTranslationEntries;
      voucher: SimpleTranslationEntries;
      biome: SimpleTranslationEntries;
      pokemonInfoContainer: SimpleTranslationEntries;
      PGMdialogue: DialogueTranslationEntries;
      PGMbattleSpecDialogue: SimpleTranslationEntries;
      PGMmiscDialogue: SimpleTranslationEntries;
      PGMdoubleBattleDialogue: DialogueTranslationEntries;
      PGFdialogue: DialogueTranslationEntries;
      PGFbattleSpecDialogue: SimpleTranslationEntries;
      PGFmiscDialogue: SimpleTranslationEntries;
      PGFdoubleBattleDialogue: DialogueTranslationEntries;
    };
  }
}

export default i18next;

export function getIsInitialized(): boolean {
  return isInitialized;
}

let isInitialized = false;
