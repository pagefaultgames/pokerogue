import { SessionSaveData } from "../../game-data";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";

export const systemMigrators = [] as const;

export const settingsMigrators = [] as const;

export const sessionMigrators = [
  /**
   *  Converts old Pokemon natureOverride and mysteryEncounterData
   *  to use the new conjoined {@linkcode Pokemon.customPokemonData} structure instead.
   *  @param data {@linkcode SessionSaveData}
   */
  function migrateCustomPokemonDataAndNatureOverrides(data: SessionSaveData) {
    // Fix Pokemon nature overrides and custom data migration
    data.party.forEach(pokemon => {
      if (pokemon["mysteryEncounterPokemonData"]) {
        pokemon.customPokemonData = new CustomPokemonData(pokemon["mysteryEncounterPokemonData"]);
        pokemon["mysteryEncounterPokemonData"] = null;
      }
      if (pokemon["fusionMysteryEncounterPokemonData"]) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData(pokemon["fusionMysteryEncounterPokemonData"]);
        pokemon["fusionMysteryEncounterPokemonData"] = null;
      }
      pokemon.customPokemonData = pokemon.customPokemonData ?? new CustomPokemonData();
      if (pokemon["natureOverride"] && pokemon["natureOverride"] >= 0) {
        pokemon.customPokemonData.nature = pokemon["natureOverride"];
        pokemon["natureOverride"] = -1;
      }
    });
  }
] as const;
