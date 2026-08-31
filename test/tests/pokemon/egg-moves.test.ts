import { speciesDataRegistry } from "#app/global-species-data-registry";
import { speciesEggMoves } from "#balance/moves/egg-moves";
import { SpeciesId } from "#enums/species-id";
import { describe, expect, it } from "vitest";

describe("Egg Moves Definitions", () => {
  it("has egg moves defined for all possible starters", () => {
    for (const speciesId of speciesDataRegistry.getAllStarters()) {
      if (speciesId === SpeciesId.PIKACHU) {
        continue;
      }
      expect(speciesEggMoves).toHaveProperty(String(speciesId));
      expect(speciesEggMoves[speciesId]).toHaveLength(4);
    }
  });
});
