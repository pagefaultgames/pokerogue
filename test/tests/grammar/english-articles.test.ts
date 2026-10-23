import {
  applyEnglishPossessives,
  createEnglishArticleFormatter,
  createEnglishPossessiveFormatter,
  EnglishPossessiveProcessor,
  startsWithEnglishVowelSound,
  withEnglishArticle,
  withEnglishPossessive,
} from "#grammar/languages/en";
import { describe, expect, it } from "vitest";

describe("Utils - English articles", () => {
  it.each([
    ["Eevee", true],
    ["Umbreon", true],
    ["Onix", true],
    ["apple", true],
    ["Pikachu", false],
    ["unicorn", false],
    ["Uniform", false],
    ["unimportant", true],
    ["unanimous", false],
    ["user", false],
    ["one", false],
    ["hour", true],
    ["Honest", true],
    ["Hat", false],
    ["HP", true],
    ["PP", false],
    ["EXP", true],
    ["UFO", false],
    ["X-ray", true],
    ["U-turn", false],
  ])("%j starts with a vowel sound: %j", (word, expected) => {
    expect(startsWithEnglishVowelSound(word)).toBe(expected);
  });

  it("prefixes the right article", () => {
    expect(withEnglishArticle("Eevee")).toBe("an Eevee");
    expect(withEnglishArticle("Pikachu")).toBe("a Pikachu");
  });

  it("corrects possessive suffixes for interpolated names", () => {
    expect(applyEnglishPossessives("Chris's Pokémon", ["Chris"])).toBe("Chris’ Pokémon");
    expect(applyEnglishPossessives("Eevee's Pokémon", ["Eevee"])).toBe("Eevee’s Pokémon");
    expect(applyEnglishPossessives("Chris’s Pokémon", ["Chris"])).toBe("Chris’ Pokémon");
    expect(applyEnglishPossessives("Chris's and Chris's Pokémon", ["Chris"])).toBe("Chris’ and Chris’ Pokémon");
    expect(applyEnglishPossessives("Chris's Pokémon", ["Other"])).toBe("Chris's Pokémon");
  });

  it("applies automatic possessive correction only to English source text", () => {
    const processor = new EnglishPossessiveProcessor();
    expect(
      processor.process(
        "a Eevee and Chris's Pokémon",
        "key",
        {
          lng: "fr",
          i18nResolved: { usedLng: "en" },
          name: "Chris",
        },
        {},
      ),
    ).toBe("a Eevee and Chris’ Pokémon");
    expect(
      processor.process(
        "a Eevee and Chris's Pokémon",
        "key",
        {
          lng: "en",
          i18nResolved: { usedLng: "fr" },
          name: "Chris",
        },
        {},
      ),
    ).toBe("a Eevee and Chris's Pokémon");
  });

  it("formats possessives", () => {
    expect(withEnglishPossessive("Eevee")).toBe("Eevee’s");
    expect(withEnglishPossessive("Dugtrio")).toBe("Dugtrio’s");
    expect(withEnglishPossessive("Charles")).toBe("Charles’");
    expect(withEnglishPossessive("Berries")).toBe("Berries’");
    const formatter = createEnglishPossessiveFormatter();
    expect(formatter("Chris")).toBe("Chris’");
  });

  it("formats articles", () => {
    const formatter = createEnglishArticleFormatter();
    expect(formatter("Eevee", "en")).toBe("an Eevee");
    expect(formatter("Eevee", "de")).toBe("an Eevee");
    expect(formatter("Eevee", "en", { capitalize: true })).toBe("An Eevee");
  });
});
