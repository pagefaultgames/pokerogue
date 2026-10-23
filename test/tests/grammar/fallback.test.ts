import { capitalizeFormatter } from "#grammar/common";
import { GRAMMAR as GERMAN_GRAMMAR } from "#grammar/languages/de";
import { createEnglishArticleFormatter, GRAMMAR as ENGLISH_GRAMMAR } from "#grammar/languages/en";
import { GRAMMAR as SPANISH_GRAMMAR } from "#grammar/languages/es";
import { createFrenchArticleFormatter, GRAMMAR as FRENCH_GRAMMAR } from "#grammar/languages/fr";
import { GRAMMAR as ITALIAN_GRAMMAR } from "#grammar/languages/it";
import { GRAMMAR as PORTUGUESE_GRAMMAR } from "#grammar/languages/pt";
import { GRAMMAR as RUSSIAN_GRAMMAR } from "#grammar/languages/ru";
import { GRAMMAR as SWEDISH_GRAMMAR } from "#grammar/languages/sv";
import { GRAMMAR as UKRAINIAN_GRAMMAR } from "#grammar/languages/uk";
import i18next from "i18next";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Grammar post-processors with language fallback", () => {
  beforeAll(async () => {
    const instance = i18next.createInstance();
    const grammarModules = [
      FRENCH_GRAMMAR,
      ENGLISH_GRAMMAR,
      GERMAN_GRAMMAR,
      RUSSIAN_GRAMMAR,
      SPANISH_GRAMMAR,
      ITALIAN_GRAMMAR,
      PORTUGUESE_GRAMMAR,
      SWEDISH_GRAMMAR,
      UKRAINIAN_GRAMMAR,
    ];
    for (const processor of grammarModules.flatMap(module => module.postProcessors)) {
      instance.use(processor);
    }
    await instance.init({
      lng: "fr",
      fallbackLng: "en",
      postProcess: [
        "french-elision",
        "english-possessive",
        "german-contraction",
        "russian-preposition",
        "spanish-contraction",
        "italian-elision",
        "portuguese-contraction",
        "swedish-genitive",
      ],
      postProcessPassResolved: true,
      resources: {
        en: {
          translation: {
            giveMe: "Give me a Eevee",
            onlyEnglish: "{{name}} gives {{item, en_indefinite}} to me about it",
            russianInline: "{{name, ru_genitive(gender: feminine)}}: {{forms, ru_agreement(gender: feminine)}}",
            russianIndeclinable: "{{name, ru_genitive(declinable: false)}}",
            russianPast: "{{ability}} {{ability, ru_past(verb: защити)}}",
            swedishGenitiveFallback: "{{name}}s item",
          },
        },
        fr: { translation: { translated: "Je vois le Ami", giveMe: undefined } },
        de: {
          translation: {
            germanContraction: "Ich gehe in das Haus.",
            germanArticles: "{{noun, de_definite(case: dative, gender: feminine)}}",
          },
        },
        ru: {
          translation: {
            grammar: "{{name, ru_genitive}}: {{verbForms, ru_agreement}}",
          },
        },
        es: {
          translation: {
            translatedSpanish: "Voy a el Pokémon.",
            spanishArticle: "{{item, es_definite(gender: feminine)}}",
            capitalizedName: "{{name, capitalize}}",
          },
        },
        it: {
          translation: {
            italianElision: "Vado a la amica.",
            italianArticles: "{{item, it_definite}} e {{other, it_indefinite(gender: feminine)}}",
          },
        },
        "pt-BR": {
          translation: {
            portugueseContraction: "Vou de o amigo.",
            portugueseArticles: "{{item, pt_definite}} e {{other, pt_indefinite(gender: feminine)}}",
          },
        },
        sv: {
          translation: {
            swedishGenitive: "{{name}}s föremål",
            swedishArticle: "{{item, sv_indefinite(gender: neuter)}}",
            swedishAdjective: "{{forms, sv_adjective(gender: neuter)}}",
          },
        },
        uk: {
          translation: {
            ukrainianCase: "{{name, uk_genitive(gender: feminine)}}",
            ukrainianAgreement: "{{forms, uk_agreement(gender: feminine)}}",
          },
        },
      },
    });
    const formatter = instance.services.formatter;
    formatter?.add("capitalize", capitalizeFormatter);
    formatter?.add("en_indefinite", createEnglishArticleFormatter());
    formatter?.add("fr_definite", createFrenchArticleFormatter("definite"));
    for (const module of grammarModules) {
      for (const [name, format] of Object.entries(module.formatters)) {
        formatter?.add(name, format);
      }
    }
    (globalThis as Record<string, unknown>).__i18n = instance;
  });

  afterAll(() => {
    delete (globalThis as Record<string, unknown>).__i18n;
  });

  const t = (key: string, lng: string, options: object = {}) =>
    ((globalThis as Record<string, unknown>).__i18n as typeof i18next).t(key, { lng, ...options });

  it("applies French elision to translated French text", () => {
    expect(t("translated", "fr")).toBe("Je vois l’Ami");
  });

  it("does not automatically correct a/an in English fallback text", () => {
    expect(t("giveMe", "de")).toBe("Give me a Eevee");
    expect(t("giveMe", "fr")).toBe("Give me a Eevee");
  });

  it("does not elide English fallback text shown in French", () => {
    expect(t("onlyEnglish", "fr", { name: "Bob", item: "apple" })).toBe("Bob gives an apple to me about it");
  });

  it("applies German contractions to German source text", () => {
    expect(t("germanContraction", "de")).toBe("Ich gehe ins Haus.");
  });

  it("uses German article formatter options inline", () => {
    expect(t("germanArticles", "de", { noun: "Schule" })).toBe("der Schule");
  });

  it("applies Swedish genitive formatting to Swedish text, not English fallback", () => {
    expect(t("swedishGenitive", "sv", { name: "Lars" })).toBe("Lars’ föremål");
    expect(t("swedishGenitiveFallback", "sv", { name: "Lars" })).toBe("Larss item");
  });

  it("uses Swedish indefinite article formatter options inline", () => {
    expect(t("swedishArticle", "sv", { item: "Pokémon" })).toBe("ett Pokémon");
  });

  it("uses Swedish adjective agreement options inline", () => {
    expect(t("swedishAdjective", "sv", { forms: "röd|rött|röda|röda" })).toBe("rött");
  });

  it("uses Ukrainian case and agreement formatters inline", () => {
    expect(t("ukrainianCase", "uk", { name: "Анна" })).toBe("Анни");
    expect(t("ukrainianAgreement", "uk", { forms: "переміг|перемогла|перемогло|перемогли" })).toBe("перемогла");
  });

  it("uses the Russian case and gender formatters with per-variable metadata", () => {
    expect(
      t("grammar", "ru", {
        name: "Анна",
        verbForms: "победил|победила|победило",
        formatParams: {
          name: { gender: "feminine" },
          verbForms: { gender: "feminine" },
        },
      }),
    ).toBe("Анны: победила");
  });

  it("lets translators set Russian grammar options inline", () => {
    expect(t("russianInline", "ru", { name: "Анна", forms: "победил|победила|победило" })).toBe("Анны: победила");
    expect(t("russianIndeclinable", "ru", { name: "Пикачу" })).toBe("Пикачу");
    expect(t("russianPast", "ru", { ability: "Зловоние" })).toBe("Зловоние защитило");
  });

  it("applies Spanish contractions to Spanish source text only", () => {
    expect(t("translatedSpanish", "es")).toBe("Voy al Pokémon.");
  });

  it("uses Spanish article formatter options inline", () => {
    expect(t("spanishArticle", "es", { item: "Poción" })).toBe("la Poción");
  });

  it("capitalizes any variable with the shared formatter", () => {
    expect(t("capitalizedName", "es", { name: "el Pokémon salvaje" })).toBe("El Pokémon salvaje");
  });

  it("applies Italian elision to Italian source text", () => {
    expect(t("italianElision", "it")).toBe("Vado all’amica.");
  });

  it("uses Italian article formatter options inline", () => {
    expect(t("italianArticles", "it", { item: "amico", other: "amica" })).toBe("l’amico e un’amica");
  });

  it("applies Portuguese contractions to Portuguese source text", () => {
    expect(t("portugueseContraction", "pt-BR")).toBe("Vou do amigo.");
  });

  it("uses Portuguese article formatter options inline", () => {
    expect(t("portugueseArticles", "pt-BR", { item: "Poção", other: "amiga" })).toBe("a Poção e uma amiga");
  });
});
