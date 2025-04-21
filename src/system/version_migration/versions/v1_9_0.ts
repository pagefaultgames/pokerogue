import type { SessionSaveMigrator } from "#app/@types/SessionSaveMigrator";
import { loadBattlerTag } from "#app/data/battler-tags";
import { PokemonMove } from "#app/field/pokemon";
import type { SessionSaveData } from "#app/system/game-data";
import PokemonData from "#app/system/pokemon-data";
import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";

/**
 * Migrate all lingering rage fist data inside `CustomPokemonData`,
 * as well as enforcing default values across the board.
 * @param data - {@linkcode SystemSaveData}
 */
const migratePartyData: SessionSaveMigrator = {
  version: "1.9.0",
  migrate: (data: SessionSaveData): void => {
    data.party = data.party.map(pkmnData => {
      // this stuff is copied straight from the constructor fwiw
      pkmnData.moveset = pkmnData.moveset.filter(m => !!m) ?? [
        new PokemonMove(Moves.TACKLE),
        new PokemonMove(Moves.GROWL),
      ];
      pkmnData.pokeball ??= PokeballType.POKEBALL;
      pkmnData.summonData.tags = pkmnData.summonData.tags.map((t: any) => loadBattlerTag(t));
      if (
        "hitsRecCount" in pkmnData.customPokemonData &&
        typeof pkmnData.customPokemonData["hitsRecCount"] === "number"
      ) {
        pkmnData.battleData.hitCount = pkmnData.customPokemonData?.["hitsRecCount"];
      }
      return new PokemonData(pkmnData);
    });
  },
};

export const sessionMigrators: Readonly<SessionSaveMigrator[]> = [migratePartyData] as const;
