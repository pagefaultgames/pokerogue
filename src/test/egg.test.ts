import {describe, expect, it} from "vitest";
import BattleScene from "../battle-scene";
import { getLegendaryGachaSpeciesForTimestamp } from "#app/data/egg.js";
import { Species } from "#app/data/enums/species.js";

describe("getLegendaryGachaSpeciesForTimestamp", () => {
  it("should return Arceus for the given timestamp", () => {
    const scene = new BattleScene();
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
});
