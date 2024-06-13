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

const fonts = [
  new FontFace("emerald", "url(./fonts/PokePT_Wansung.ttf)", { unicodeRange: "U+AC00-D7AC"}),
  Object.assign(
    new FontFace("pkmnems", "url(./fonts/PokePT_Wansung.ttf)", { unicodeRange: "U+AC00-D7AC"}),
    { sizeAdjust: "133%" }
  ),
];

function initFonts() {
  fonts.forEach((fontFace: FontFace) => {
    fontFace.load().then(f => document.fonts.add(f)).catch(e => console.error(e));
  });
}

export async function initI18n(): Promise<void> {
  // Prevent reinitialization
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  initFonts();

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

  i18next.use(LanguageDetector);
  i18next.use(processor);
  i18next.use(new KoreanPostpositionProcessor());
  await i18next.init({
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "it", "de", "zh", "pt", "ko"],
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
}

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "menu"; // Even if we don't use it, i18next requires a valid default namespace
    resources: {
      ability: AbilityTranslationEntries;
      abilityTriggers: SimpleTranslationEntries;
      achv: AchievementTranslationEntries;
      battle: SimpleTranslationEntries;
      battleMessageUiHandler: SimpleTranslationEntries;
      berry: BerryTranslationEntries;
      biome: SimpleTranslationEntries;
      challenges: SimpleTranslationEntries;
      commandUiHandler: SimpleTranslationEntries;
      PGMachv: AchievementTranslationEntries;
      PGMdialogue: DialogueTranslationEntries;
      PGMbattleSpecDialogue: SimpleTranslationEntries;
      PGMmiscDialogue: SimpleTranslationEntries;
      PGMdoubleBattleDialogue: DialogueTranslationEntries;
      PGFdialogue: DialogueTranslationEntries;
      PGFbattleSpecDialogue: SimpleTranslationEntries;
      PGFmiscDialogue: SimpleTranslationEntries;
      PGFdoubleBattleDialogue: DialogueTranslationEntries;
      PGFachv: AchievementTranslationEntries;
      egg: SimpleTranslationEntries;
      fightUiHandler: SimpleTranslationEntries;
      gameMode: SimpleTranslationEntries;
      gameStatsUiHandler: SimpleTranslationEntries;
      growth: SimpleTranslationEntries;
      menu: SimpleTranslationEntries;
      menuUiHandler: SimpleTranslationEntries;
      modifierType: ModifierTypeTranslationEntries;
      move: MoveTranslationEntries;
      nature: SimpleTranslationEntries;
      partyUiHandler: SimpleTranslationEntries;
      pokeball: SimpleTranslationEntries;
      pokemon: SimpleTranslationEntries;
      pokemonInfo: PokemonInfoTranslationEntries;
      pokemonInfoContainer: SimpleTranslationEntries;
      saveSlotSelectUiHandler: SimpleTranslationEntries;
      splashMessages: SimpleTranslationEntries;
      starterSelectUiHandler: SimpleTranslationEntries;
      titles: SimpleTranslationEntries;
      trainerClasses: SimpleTranslationEntries;
      trainerNames: SimpleTranslationEntries;
      tutorial: SimpleTranslationEntries;
      voucher: SimpleTranslationEntries;
      weather: SimpleTranslationEntries;
    };
  }
}

export default i18next;

export function getIsInitialized(): boolean {
  return isInitialized;
}

let isInitialized = false;

