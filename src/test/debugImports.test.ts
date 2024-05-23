import { describe, expect, it} from "vitest";
import {initStatsKeys} from "#app/ui/game-stats-ui-handler";

async function importModule() {
  try {
    initStatsKeys();
    const { PokemonMove } = await import("#app/field/pokemon");
    const { Species } = await import("#app/data/enums/species");
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

