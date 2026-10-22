import {
  applyEnglishArticles,
  createEnglishArticleFormatter,
  createEnglishPossessiveFormatter,
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

  it.each([
    ["You see a Eevee", "You see an Eevee"],
    ["You see an Pikachu", "You see a Pikachu"],
    ["An Pikachu appeared!", "A Pikachu appeared!"],
    ["A Eevee appeared!", "An Eevee appeared!"],
    ["a @c{smile}Eevee", "an @c{smile}Eevee"],
    ["Gain a HP Up", "Gain an HP Up"],
    ["a 5% chance", "a 5% chance"],
    ["Banana is not a word", "Banana is not a word"],
    ["a unicorn", "a unicorn"],
  ])("%j -> %j", (input, expected) => {
    expect(applyEnglishArticles(input)).toBe(expected);
  });

  it("leaves protected interpolated values untouched", () => {
    expect(applyEnglishArticles("Hi a Eevee, you are a Eevee", ["a Eevee"])).toBe("Hi a Eevee, you are a Eevee");
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
