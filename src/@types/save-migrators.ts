import type { PokemonData } from "#system/pokemon-data";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { CoercePropertiesToUnknown, NonFunctionProperties } from "#types/type-helpers";

/**
 * Interface for the type of the elements of `party` and `enemyParty` properties
 * of {@linkcode SessionSaveMigratorIn}.
 */
interface SessionSavePokemonDataIn extends CoercePropertiesToUnknown<NonFunctionProperties<PokemonData>> {
  [key: string]: unknown;
}

/**
 * Interface for the input data of session migrators.
 * @see {@linkcode SessionSaveMigrator}
 */
export interface SessionSaveMigratorIn extends CoercePropertiesToUnknown<SessionSaveData> {
  gameVersion: string;
  /**
   * @privateRemarks
   * Due to the field's ubiquitous use in migrators,
   * party being an array of objects is validated prior to running any migrators.
   */
  party: SessionSavePokemonDataIn[];
  /**
   * @privateRemarks
   * Due to the field's ubiquitous use in migrators,
   * party being an array of objects is validated prior to running any migrators.
   */
  enemyParty: SessionSavePokemonDataIn[];
  [key: string]: unknown;
}

export interface SessionSaveMigrator {
  version: string;
  migrate: (data: SessionSaveMigratorIn) => void;
}

export interface SettingsSaveMigrator {
  version: string;
  migrate: (data: object) => void;
}

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
