import type { SessionSaveMigrator, SessionSaveMigratorIn } from "#types/save-migrators";

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
 */
const migratePartyData = {
  name: "migratePartyData",
  version: "1.9.0",
  migrate: (data: SessionSaveMigratorIn): void => {
    data.party.forEach(updatePokemonMoveset);
    data.enemyParty.forEach(updatePokemonMoveset);
  },
} as const satisfies SessionSaveMigrator;

export const sessionMigrators = [migratePartyData] as const satisfies readonly SessionSaveMigrator[];
