import type { SessionSaveMigrator } from "#types/save-migrators";

function updatePokemonMoveset(data: Record<string, unknown>): void {
  if (typeof data.customPokemonData !== "object" || data.customPokemonData === null) {
    data.customPokemonData = {};
  }

  if (typeof data.battleData !== "object" || data.battleData === null) {
    data.battleData = {};
  }

  if (data.customPokemonData && typeof data.customPokemonData["hitsRecCount"] === "number") {
    // cast is safe since we check the presence of hitCount above.
    (data.battleData as { hitCount?: number }).hitCount = data.customPokemonData["hitsRecCount"];
    // biome-ignore lint/performance/noDelete: intentional, the field doesn't exist anymore
    delete data.customPokemonData["hitsRecCount"];
  }
}

/**
 * Migrate all lingering rage fist data inside `CustomPokemonData`,
 * as well as enforcing default values across the board.
 * @param data - {@linkcode SystemSaveData}
 */
const migratePartyData: SessionSaveMigrator = {
  version: "1.9.0",
  migrate: data => {
    data.party.forEach(updatePokemonMoveset);
    data.enemyParty.forEach(updatePokemonMoveset);
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migratePartyData] as const;
