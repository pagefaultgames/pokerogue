import { MoveId } from "#enums/move-id";
import { PokemonMove } from "#moves/pokemon-move";
import type { SessionSaveMigrator } from "#types/save-migrators";

function updatePokemonMoveset(data: Record<string, unknown>): void {
  if ("moveset" in data && Array.isArray(data.moveset)) {
    data.moveset = data.moveset.filter(m => !!m).map(m => PokemonMove.loadMove(m));
  } else {
    data["moveset"] = [new PokemonMove(MoveId.TACKLE), new PokemonMove(MoveId.GROWL)];
  }

  if (typeof data.customPokemonData !== "object" || data.customPokemonData === null) {
    data.customPokemonData = {};
  }

  if (typeof data.battleData !== "object" || data.battleData === null) {
    data.battleData = {};
  }

  if (data.customPokemonData && typeof data.customPokemonData["hitsRecCount"] === "number") {
    // cast is safe since we check the presence of hitCount above.
    (data.battleData as { hitCount?: number }).hitCount = data.customPokemonData["hitsRecCount"];
    data.customPokemonData["hitsRecCount"] = null;
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
