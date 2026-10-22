import { applyFrenchElision } from "#grammar/fr";
import { describe, expect, it } from "vitest";

describe("Utils - French elision", () => {
  it.each([
    ["Il évite la attaque !", "Il évite l’attaque !"],
    ["Le Évoli sauvage", "L’Évoli sauvage"],
    ["de Aquali", "d’Aquali"],
    ["Il faut que il", "Il faut qu’il"],
    ["je ai", "j’ai"],
    ["ne pas utiliser", "ne pas utiliser"],
    ["la Hypnomade", "l’Hypnomade"],
    ["le Héros", "le Héros"],
    ["le yaourt", "le yaourt"],
    ["la hauteur", "la hauteur"],
    ["la haute tour", "la haute tour"],
    ["les harceleurs, le harceler", "les harceleurs, le harceler"],
    ["le Hérisson et le hérissé", "le Hérisson et le hérissé"],
    ["la hache", "la hache"],
    ["le onzième", "le onzième"],
    ["l’hôtel : le hôtel", "l’hôtel : l’hôtel"],
    ["la huile, la huître", "l’huile, l’huître"],
    ["la héroïne", "l’héroïne"],
    ["le ouistiti", "l’ouistiti"],
    ["le Hollandais, la Hongrie, le Haïti", "le Hollandais, la Hongrie, le Haïti"],
    ["le hamster, le hangar, la hanche, le handicap", "le hamster, le hangar, la hanche, le handicap"],
    ["la harpe, le harpon, la hyène, la honte", "la harpe, le harpon, la hyène, la honte"],
    ["le heurtoir, la hotte, le hublot, la hutte", "le heurtoir, la hotte, le hublot, la hutte"],
    ["le hall, le halo, la halle, le hold-up", "le hall, le halo, la halle, le hold-up"],
    ["le Heatran, le Houndour", "le Heatran, le Houndour"],
    ["l’habit, l’hôtel, l’heure, l’hiver, l’homme", "l’habit, l’hôtel, l’heure, l’hiver, l’homme"],
    ["la habitude, le hôtel, la heure, le hiver, le homme", "l’habitude, l’hôtel, l’heure, l’hiver, l’homme"],
    [
      "la hallucination, la haleine, le hippopotame, la harmonie",
      "l’hallucination, l’haleine, l’hippopotame, l’harmonie",
    ],
    ["la honnêteté, la hiérarchie, la hagiographie, le humain", "l’honnêteté, l’hiérarchie, l’hagiographie, l’humain"],
    ["le oui", "le oui"],
    [
      "le yacht, le yaourt, le yak, le yankee, la yourte, le yoga, le yogi, le yo-yo, la yole",
      "le yacht, le yaourt, le yak, le yankee, la yourte, le yoga, le yogi, le yo-yo, la yole",
    ],
    [
      "le yéti, le yen, le yuan, le yucca, le yuppie, le yin, le yang, le yiddish, le Yémen, le yé-yé",
      "le yéti, le yen, le yuan, le yucca, le yuppie, le yin, le yang, le yiddish, le Yémen, le yé-yé",
    ],
    ["la yeuse, le yttrium, la Yvonne, de Yves, le Ypres", "l’yeuse, l’yttrium, l’Yvonne, d’Yves, l’Ypres"],
    ["de\nÉvoli", "d’Évoli"],
    ["de @c{smile}Évoli", "d’@c{smile}Évoli"],
    ["Pokémon", "Pokémon"],
    ["il a cherché le chemin", "il a cherché le chemin"],
    ["l’attaque", "l’attaque"],
  ])("%j -> %j", (input, expected) => {
    expect(applyFrenchElision(input)).toBe(expected);
  });

  it("leaves protected interpolated values untouched", () => {
    expect(applyFrenchElision("le Hibou dit : le Ami !", ["le Ami"])).toBe("le Hibou dit : le Ami !");
    expect(applyFrenchElision("le Ami", [])).toBe("l’Ami");
  });
});
