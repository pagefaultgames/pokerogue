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
    ["de\nÉvoli", "d’Évoli"],
    ["de @c{smile}Évoli", "d’@c{smile}Évoli"],
    ["Pokémon", "Pokémon"],
    ["il a cherché le chemin", "il a cherché le chemin"],
    ["l’attaque", "l’attaque"],
  ])("%j -> %j", (input, expected) => {
    expect(applyFrenchElision(input)).toBe(expected);
  });
});
