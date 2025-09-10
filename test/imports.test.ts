import { initStatsKeys } from "#ui/handlers/game-stats-ui-handler";
import { describe, expect, it } from "vitest";

async function importModule() {
  try {
    initStatsKeys();
    const { PokemonMove } = await import("#app/data/moves/pokemon-move");
    const { SpeciesId: Species } = await import("#enums/species-id");
    return {
      PokemonMove,
      Species,
    };
    // Dynamically import the module
  } catch (error) {
    // Log the error stack trace
    console.error("Error during import:", error.stack);
    // Rethrow the error to ensure the test fails
    throw error;
  }
}

describe("tests to debug the import, with trace", () => {
  it("import PokemonMove module", async () => {
    const module = await importModule();
    // Example assertion
    expect(module.PokemonMove).toBeDefined();
  });

  it("import Species module", async () => {
    const module = await importModule();
    // Example assertion
    expect(module.Species).toBeDefined();
  });
});
