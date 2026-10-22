import { createEnglishArticleFormatter, EnglishArticleProcessor } from "#grammar/en";
import { createFrenchArticleFormatter, FrenchElisionProcessor } from "#grammar/fr";
import i18next from "i18next";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Grammar post-processors with language fallback", () => {
  beforeAll(async () => {
    const instance = i18next.createInstance();
    instance.use(new FrenchElisionProcessor()).use(new EnglishArticleProcessor());
    await instance.init({
      lng: "fr",
      fallbackLng: "en",
      postProcess: ["french-elision", "english-article"],
      postProcessPassResolved: true,
      resources: {
        en: {
          translation: {
            giveMe: "Give me a Eevee",
            onlyEnglish: "{{name}} gives {{item, en_indefinite}} to me about it",
          },
        },
        fr: { translation: { translated: "Je vois le Ami", giveMe: undefined } },
        de: { translation: {} },
      },
    });
    instance.services.formatter?.add("en_indefinite", createEnglishArticleFormatter());
    instance.services.formatter?.add("fr_definite", createFrenchArticleFormatter("definite"));
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

  it("applies English fixes only to English fallback text shown in another language", () => {
    expect(t("giveMe", "de")).toBe("Give me an Eevee");
    expect(t("giveMe", "fr")).toBe("Give me an Eevee");
  });

  it("does not elide English fallback text shown in French", () => {
    expect(t("onlyEnglish", "fr", { name: "Bob", item: "apple" })).toBe("Bob gives an apple to me about it");
  });
});
