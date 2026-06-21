import { PokemonType } from "#enums/pokemon-type";
import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/save-migrators";

const migrateRageFistHitCount: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party.concat(data.enemyParty)) {
      p.summonData.hitCount = p.battleData.hitCount;
    }
  },
};

const convertCustomPokemonDataTypes: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party) {
      if (p.customPokemonData.types.length > 0) {
        p.customPokemonData.types = p.customPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? null : t,
        );
      }
      if (p.fusionCustomPokemonData.types.length > 0) {
        p.fusionCustomPokemonData.types = p.fusionCustomPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? null : t,
        );
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [
  migrateRageFistHitCount,
  convertCustomPokemonDataTypes,
] as const;
