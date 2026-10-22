import { CAPITALIZE_LANGUAGES } from "#grammar/common";
import { createFrenchArticleFormatter, withFrenchArticle } from "#grammar/languages/fr";
import { describe, expect, it } from "vitest";

describe("Utils - French articles", () => {
  it.each([
    ["Œuf Chance", "definite", "l’Œuf Chance"],
    ["Œuf Chance", "de", "de l’Œuf Chance"],
    ["Œuf Chance", "a", "à l’Œuf Chance"],
    ["Œuf Chance", "indefinite", "un Œuf Chance"],
    ["Huile", "definite", "l’Huile"],
    ["Huile", "indefinite", "une Huile"],
    ["Poireau", "definite", "le Poireau"],
    ["Poireau", "de", "du Poireau"],
    ["Poireau", "a", "au Poireau"],
    ["Baie Sitrus", "definite", "la Baie Sitrus"],
    ["Baie Sitrus", "de", "de la Baie Sitrus"],
    ["Baie Sitrus", "a", "à la Baie Sitrus"],
    ["Poké Ball", "indefinite", "une Poké Ball"],
    ["Heatranite", "definite", "la Heatranite"],
    ["Restes", "definite", "les Restes"],
    ["Restes", "de", "des Restes"],
    ["Restes", "a", "aux Restes"],
    ["Restes", "indefinite", "des Restes"],
    ["Inconnu", "definite", "l’Inconnu"],
    ["Mystère", "definite", "le Mystère"],
  ] as const)("%s (%s) -> %s", (noun, form, expected) => {
    expect(withFrenchArticle(noun, form)).toBe(expected);
  });

  it("handles possessives", () => {
    expect(withFrenchArticle("Vitesse", "possessive")).toBe("sa Vitesse");
    expect(withFrenchArticle("Esquive", "possessive")).toBe("son Esquive");
    expect(withFrenchArticle("Attaque", "possessive")).toBe("son Attaque");
    expect(withFrenchArticle("PV", "possessive")).toBe("ses PV");
  });

  it("handles demonstratives", () => {
    expect(withFrenchArticle("Poireau", "demonstrative")).toBe("ce Poireau");
    expect(withFrenchArticle("Élixir", "demonstrative")).toBe("cet Élixir");
    expect(withFrenchArticle("Potion", "demonstrative")).toBe("cette Potion");
    expect(withFrenchArticle("Restes", "demonstrative")).toBe("ces Restes");
  });

  it("does not depend on the active language", () => {
    const formatter = createFrenchArticleFormatter("definite");
    expect(formatter("Poireau", "fr")).toBe("le Poireau");
    expect(formatter("Poireau", "de")).toBe("le Poireau");
  });

  it("capitalizes on request", () => {
    const formatter = createFrenchArticleFormatter("definite");
    expect(formatter("Poireau", "fr", { capitalize: true })).toBe("Le Poireau");
    expect(formatter("Élixir", "fr", { capitalize: "true" })).toBe("L’Élixir");
  });

  it("honors the capitalization language list", () => {
    const formatter = createFrenchArticleFormatter("definite");
    CAPITALIZE_LANGUAGES.delete("fr");
    try {
      expect(formatter("Poireau", "fr", { capitalize: true })).toBe("le Poireau");
    } finally {
      CAPITALIZE_LANGUAGES.add("fr");
    }
  });
});
