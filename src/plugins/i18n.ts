import pkg from "#package.json";
import { toKebabCase } from "#utils/strings";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import processor, { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";

//#region Interfaces/Types

interface LoadingFontFaceProperty {
  face: FontFace;
  extraOptions?: { [key: string]: any };
  only?: Array<string>;
}

//#region Constants

let isInitialized = false;

const unicodeRanges = {
  fullwidth: "U+FF00-FFEF",
  hangul: "U+1100-11FF,U+3130-318F,U+A960-A97F,U+AC00-D7AF,U+D7B0-D7FF",
  kana: "U+3040-30FF",
  CJKCommon: "U+2E80-2EFF,U+3000-303F,U+31C0-31EF,U+3200-32FF,U+3400-4DBF,U+F900-FAFF,U+FE30-FE4F",
  CJKIdeograph: "U+4E00-9FFF",
  specialCharacters: "U+266A,U+2605,U+2665,U+2663", //♪.★,♥,♣
};

const rangesByLanguage = {
  korean: [unicodeRanges.CJKCommon, unicodeRanges.hangul].join(","),
  chinese: [unicodeRanges.CJKCommon, unicodeRanges.fullwidth, unicodeRanges.CJKIdeograph].join(","),
  japanese: [unicodeRanges.CJKCommon, unicodeRanges.fullwidth, unicodeRanges.kana, unicodeRanges.CJKIdeograph].join(
    ",",
  ),
};

const fonts: Array<LoadingFontFaceProperty> = [
  // unicode (special character from PokePT)
  {
    face: new FontFace("emerald", "url(./fonts/PokePT_Wansung.woff2)", {
      unicodeRange: unicodeRanges.specialCharacters,
    }),
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/PokePT_Wansung.woff2)", {
      unicodeRange: unicodeRanges.specialCharacters,
    }),
    extraOptions: { sizeAdjust: "133%" },
  },
  // unicode (korean)
  {
    face: new FontFace("emerald", "url(./fonts/PokePT_Wansung.woff2)", {
      unicodeRange: rangesByLanguage.korean,
    }),
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/PokePT_Wansung.woff2)", {
      unicodeRange: rangesByLanguage.korean,
    }),
    extraOptions: { sizeAdjust: "133%" },
  },
  // unicode (chinese)
  {
    face: new FontFace("emerald", "url(./fonts/unifont-15.1.05.subset.woff2)", {
      unicodeRange: rangesByLanguage.chinese,
    }),
    extraOptions: { sizeAdjust: "70%", format: "woff2" },
    only: ["zh"],
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/unifont-15.1.05.subset.woff2)", {
      unicodeRange: rangesByLanguage.chinese,
    }),
    extraOptions: { format: "woff2" },
    only: ["zh"],
  },
  // japanese
  {
    face: new FontFace("emerald", "url(./fonts/pokemon-bw.ttf)", {
      unicodeRange: rangesByLanguage.japanese,
    }),
    only: ["en", "es", "fr", "it", "de", "pt", "ko", "ja", "ca", "da", "tr", "ro", "ru", "tl"],
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/pokemon-bw.ttf)", {
      unicodeRange: rangesByLanguage.japanese,
    }),
    only: ["en", "es", "fr", "it", "de", "pt", "ko", "ja", "ca", "da", "tr", "ro", "ru", "tl"],
  },
];

/** maps namespaces that deviate from the file-name */
const namespaceMap = {
  titles: "trainer-titles",
  moveTriggers: "move-trigger",
  abilityTriggers: "ability-trigger",
  battlePokemonForm: "pokemon-form-battle",
  miscDialogue: "dialogue-misc",
  battleSpecDialogue: "dialogue-final-boss",
  doubleBattleDialogue: "dialogue-double-battle",
  splashMessages: "splash-texts",
  mysteryEncounterMessages: "mystery-encounter-texts",
  biome: "biomes",
};

//#region Functions

async function initFonts(language: string | undefined) {
  const results = await Promise.allSettled(
    fonts
      .filter(font => !font.only || font.only.some(exclude => language?.indexOf(exclude) === 0))
      .map(font => Object.assign(font.face, font.extraOptions ?? {}).load()),
  );
  for (const result of results) {
    if (result.status === "fulfilled") {
      document.fonts?.add(result.value);
    } else {
      console.error(result.reason);
    }
  }
}

/**
 * I18n money formatter with. (useful for BBCode coloring of text) \
 * _If you don't want the BBCode tag applied, just use 'number' formatter_
 * @example Input: `{{myMoneyValue, money}}`
 *          Output: `@[MONEY]{₽100,000,000}`
 * @param amount the money amount
 * @returns a money formatted string
 */
function i18nMoneyFormatter(amount: any): string {
  if (Number.isNaN(Number(amount))) {
    console.warn(`i18nMoneyFormatter: value "${amount}" is not a number!`);
  }

  return `@[MONEY]{${i18next.t("common:money", { amount })}}`;
}

//#region Exports

/**
 * Initialize i18n with fonts
 */
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

  i18next.use(HttpBackend);
  i18next.use(LanguageDetector);
  i18next.use(processor);
  i18next.use(new KoreanPostpositionProcessor());
  await i18next.init({
    fallbackLng: {
      "es-MX": ["es-ES", "en"],
      default: ["en"],
    },
    supportedLngs: [
      "en",
      "es-ES",
      "es-MX",
      "fr",
      "it",
      "de",
      "zh-CN",
      "zh-TW",
      "pt-BR",
      "ko",
      "ja",
      "ca",
      "da",
      "tr",
      "ro",
      "ru",
      "tl",
    ],
    backend: {
      loadPath(lng: string, [ns]: string[]) {
        // Use namespace maps where required
        let fileName: string;
        if (namespaceMap[ns]) {
          fileName = namespaceMap[ns];
        } else if (ns.startsWith("mysteryEncounters/")) {
          fileName = toKebabCase(ns + "-dialogue"); // mystery-encounters/a-trainers-test-dialogue
        } else {
          fileName = toKebabCase(ns);
        }
        // ex: "./locales/en/move-anims"
        return `./locales/${lng}/${fileName}.json?v=${pkg.version}`;
      },
    },
    defaultNS: "menu",
    ns: [
      "ability",
      "abilityTriggers",
      "arenaFlyout",
      "arenaTag",
      "battle",
      "battleScene",
      "battleInfo",
      "battleMessageUiHandler",
      "battlePokemonForm",
      "battlerTags",
      "berry",
      "bgmName",
      "biome",
      "challenges",
      "commandUiHandler",
      "common",
      "achv",
      "dialogue",
      "battleSpecDialogue",
      "miscDialogue",
      "doubleBattleDialogue",
      "egg",
      "fightUiHandler",
      "filterBar",
      "filterText",
      "gameMode",
      "gameStatsUiHandler",
      "growth",
      "menu",
      "menuUiHandler",
      "modifier",
      "modifierType",
      "move",
      "nature",
      "pokeball",
      "pokedexUiHandler",
      "pokemon",
      "pokemonCategory",
      "pokemonEvolutions",
      "pokemonForm",
      "pokemonInfo",
      "pokemonInfoContainer",
      "pokemonSummary",
      "saveSlotSelectUiHandler",
      "settings",
      "splashMessages",
      "starterSelectUiHandler",
      "statusEffect",
      "terrain",
      "titles",
      "trainerClasses",
      "trainersCommon",
      "trainerNames",
      "tutorial",
      "voucher",
      "weather",
      "partyUiHandler",
      "modifierSelectUiHandler",
      "moveTriggers",
      "runHistory",
      "mysteryEncounters/mysteriousChallengers",
      "mysteryEncounters/mysteriousChest",
      "mysteryEncounters/darkDeal",
      "mysteryEncounters/fightOrFlight",
      "mysteryEncounters/slumberingSnorlax",
      "mysteryEncounters/trainingSession",
      "mysteryEncounters/departmentStoreSale",
      "mysteryEncounters/shadyVitaminDealer",
      "mysteryEncounters/fieldTrip",
      "mysteryEncounters/safariZone",
      "mysteryEncounters/lostAtSea",
      "mysteryEncounters/fieryFallout",
      "mysteryEncounters/theStrongStuff",
      "mysteryEncounters/thePokemonSalesman",
      "mysteryEncounters/anOfferYouCantRefuse",
      "mysteryEncounters/delibirdy",
      "mysteryEncounters/absoluteAvarice",
      "mysteryEncounters/aTrainersTest",
      "mysteryEncounters/trashToTreasure",
      "mysteryEncounters/berriesAbound",
      "mysteryEncounters/clowningAround",
      "mysteryEncounters/partTimer",
      "mysteryEncounters/dancingLessons",
      "mysteryEncounters/weirdDream",
      "mysteryEncounters/theWinstrateChallenge",
      "mysteryEncounters/teleportingHijinks",
      "mysteryEncounters/bugTypeSuperfan",
      "mysteryEncounters/funAndGames",
      "mysteryEncounters/uncommonBreed",
      "mysteryEncounters/globalTradeSystem",
      "mysteryEncounters/theExpertPokemonBreeder",
      "mysteryEncounterMessages",
    ],
    detection: {
      lookupLocalStorage: "prLang",
    },
    debug: Number(import.meta.env.VITE_I18N_DEBUG) === 1,
    interpolation: {
      escapeValue: false,
    },
    postProcess: ["korean-postposition"],
  });

  if (i18next.services.formatter) {
    i18next.services.formatter.add("money", i18nMoneyFormatter);
  }

  await initFonts(localStorage.getItem("prLang") ?? undefined);
}

export function getIsInitialized(): boolean {
  return isInitialized;
}

export default i18next;

//#endregion
