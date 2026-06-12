import { PokemonType } from "#enums/pokemon-type";
import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/save-migrators";

const convertCustomPokemonDataTypes: SessionSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party.concat(data.enemyParty)) {
      if (p.customPokemonData.types.length > 0) {
        p.customPokemonData.types = p.customPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? undefined : t,
        );
      }
      if (p.fusionCustomPokemonData.types.length > 0) {
        p.fusionCustomPokemonData.types = p.fusionCustomPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? undefined : t,
        );
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [convertCustomPokemonDataTypes] as const;
