import type { SessionSaveMigrator } from "#app/@types/SessionSaveMigrator";
import { Status } from "#app/data/status-effect";
import { PokemonMove } from "#app/field/pokemon";
import type { SessionSaveData } from "#app/system/game-data";
import type PokemonData from "#app/system/pokemon-data";
import { Moves } from "#enums/moves";

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
      pkmnData.status &&= new Status(
        pkmnData.status.effect,
        pkmnData.status.toxicTurnCount,
        pkmnData.status.sleepTurnsRemaining,
      );
      // remove empty moves from moveset
      pkmnData.moveset = (pkmnData.moveset ?? [new PokemonMove(Moves.TACKLE), new PokemonMove(Moves.GROWL)])
        .filter(m => !!m)
        .map(m => PokemonMove.loadMove(m));
      // only edit summondata moveset if exists
      pkmnData.summonData.moveset &&= pkmnData.summonData.moveset.filter(m => !!m).map(m => PokemonMove.loadMove(m));

      if (
        pkmnData.customPokemonData &&
        "hitsRecCount" in pkmnData.customPokemonData &&
        typeof pkmnData.customPokemonData["hitsRecCount"] === "number"
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

export const sessionMigrators: Readonly<SessionSaveMigrator[]> = [migratePartyData] as const;
