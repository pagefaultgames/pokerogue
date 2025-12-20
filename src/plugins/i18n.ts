import pkg from "#package.json";
import { toKebabCase } from "#utils/strings";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import processor from "i18next-korean-postposition-processor";
import { namespaceMap } from "./utils-plugins";

//#region Interfaces/Types

interface LoadingFontFaceProperty {
  face: FontFace;
  extraOptions?: { [key: string]: any };
  only?: string[];
}

//#region Constants

const unicodeRanges = {
  fullwidth: "U+FF00-FFEF",
  hangul: "U+1100-11FF,U+3130-318F,U+A960-A97F,U+AC00-D7AF,U+D7B0-D7FF",
  kana: "U+3040-30FF",
  CJKCommon: "U+2E80-2EFF,U+3000-303F,U+31C0-31EF,U+3200-32FF,U+3400-4DBF,U+F900-FAFF,U+FE30-FE4F",
  CJKIdeograph: "U+4E00-9FFF",
  devanagari: "U+0900-097F",
  thai: "U+0E00-0E7F",
  specialCharacters: "U+266A,U+2605,U+2665,U+2663", //♪.★,♥,♣
};

const rangesByLanguage = {
  korean: [unicodeRanges.CJKCommon, unicodeRanges.hangul].join(","),
  chinese: [unicodeRanges.CJKCommon, unicodeRanges.fullwidth, unicodeRanges.CJKIdeograph].join(","),
  japanese: [unicodeRanges.CJKCommon, unicodeRanges.fullwidth, unicodeRanges.kana, unicodeRanges.CJKIdeograph].join(
    ",",
  ),
};

const fonts: LoadingFontFaceProperty[] = [
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
    only: ["en", "es", "fr", "it", "de", "pt", "ko", "ja", "ca", "da", "tr", "ro", "ru", "id", "hi", "tl"],
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/pokemon-bw.ttf)", {
      unicodeRange: rangesByLanguage.japanese,
    }),
    only: ["en", "es", "fr", "it", "de", "pt", "ko", "ja", "ca", "da", "tr", "ro", "ru", "id", "hi", "tl"],
  },
  // devanagari
  {
    face: new FontFace("emerald", "url(./fonts/8-bit-devanagari.ttf)", {
      unicodeRange: unicodeRanges.devanagari,
    }),
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/8-bit-devanagari.ttf)", {
      unicodeRange: unicodeRanges.devanagari,
    }),
  },
  // thai
  {
    face: new FontFace("emerald", "url(./fonts/fsrebellion.otf)", {
      unicodeRange: unicodeRanges.thai,
    }),
  },
  {
    face: new FontFace("pkmnems", "url(./fonts/terrible-thaifix.ttf)", {
      unicodeRange: unicodeRanges.thai,
    }),
  },
];

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

// assigned during post-processing in #app/plugins/vite/namespaces-i18n-plugin.ts
const nsEn: string[] = [];

//#region Exports

/*
 * i18next is a localization library for maintaining and using translation resources.
 *
 * Q: How do I add a new language?
 * A: To add a new language, create a new folder in the locales directory with the language code.
 *    Each language folder should contain a file for each namespace (ex. menu.ts) with the translations.
 *    Don't forget to declare new language in `supportedLngs` i18next initializer
 *
 * Q: How do I add a new namespace?
 * A: To add a new namespace, create a new file .json in each language folder with the translations.
 *    The expected format for the file-name is kebab-case {@link https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case}
 *    If you want the namespace name to be different from the file name, configure it in namespace-map.ts.
 *    Then update the config file for that language in its locale directory
 *    and the CustomTypeOptions interface in the @types/i18next.d.ts file.
 *
 * Q: How do I make a language selectable in the settings?
 * A: In src/system/settings.ts, add a new case to the Setting.Language switch statement.
 */

await i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(processor)
  .init(
    {
      fallbackLng: {
        "es-419": ["es-ES", "en"],
        default: ["en"],
      },
      supportedLngs: [
        "en",
        "es-ES",
        "es-419", // LATAM Spanish
        "fr",
        "it",
        "de",
        "zh-Hans",
        "zh-Hant",
        "pt-BR",
        "ko",
        "ja",
        "ca",
        "da",
        "tr",
        "ro",
        "ru",
        "id",
        "hi",
        "tl",
        "nb-NO",
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
      detection: {
        lookupLocalStorage: "prLang",
      },
      ns: nsEn,
      debug: import.meta.env.VITE_I18N_DEBUG === "1",
      interpolation: {
        escapeValue: false,
      },
      postProcess: ["korean-postposition"],
    },
    async () => {
      i18next.services.formatter?.add("money", i18nMoneyFormatter);
      await initFonts(localStorage.getItem("prLang") ?? undefined);
    },
  );

//#endregion
