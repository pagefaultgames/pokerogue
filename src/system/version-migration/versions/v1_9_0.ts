import { MoveId } from "#enums/move-id";
import { PokemonMove } from "#moves/pokemon-move";
import type { SessionSaveData } from "#system/game-data";
import type { PokemonData } from "#system/pokemon-data";
import type { SessionSaveMigrator } from "#types/session-save-migrator";

/**
 * Migrate all lingering rage fist data inside `CustomPokemonData`,
 * as well as enforcing default values across the board.
 * @param data - {@linkcode SystemSaveData}
 */
const migratePartyData: SessionSaveMigrator = {
  version: "1.9.0",
  migrate: (data: SessionSaveData): void => {
    // this stuff is copied straight from the constructor fwiw
    const mapParty = (pkmnData: PokemonData) => {
      // remove empty moves from moveset
      pkmnData.moveset = (pkmnData.moveset ?? [new PokemonMove(MoveId.TACKLE), new PokemonMove(MoveId.GROWL)])
        .filter(m => !!m)
        .map(m => PokemonMove.loadMove(m));
      // only edit summondata moveset if exists
      pkmnData.summonData.moveset &&= pkmnData.summonData.moveset.filter(m => !!m).map(m => PokemonMove.loadMove(m));

      if (
        pkmnData.customPokemonData
        && "hitsRecCount" in pkmnData.customPokemonData
        && typeof pkmnData.customPokemonData["hitsRecCount"] === "number"
      ) {
        // transfer old hit count stat to battleData.
        pkmnData.battleData.hitCount = pkmnData.customPokemonData["hitsRecCount"];
        pkmnData.customPokemonData["hitsRecCount"] = null;
      }
      return pkmnData;
    };

    data.party = data.party.map(mapParty);
    data.enemyParty = data.enemyParty.map(mapParty);
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migratePartyData] as const;
