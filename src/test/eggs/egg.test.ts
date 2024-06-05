import {beforeAll, describe, expect, it} from "vitest";
import BattleScene from "../../battle-scene";
import { getLegendaryGachaSpeciesForTimestamp } from "#app/data/egg.js";
import { Species } from "#app/data/enums/species.js";
import Phaser from "phaser";

describe("getLegendaryGachaSpeciesForTimestamp", () => {

  beforeAll(() => {
    new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  it("should return Arceus for the 10th of June", () => {
    const scene = new BattleScene();
    const timestamp = new Date(2024, 5, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
  it("should return Arceus for the 10th of July", () => {
    const scene = new BattleScene();
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
});
