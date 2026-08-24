import { GameDataType } from "#enums/game-data-type";
import { version } from "#package.json";
import { SessionMigrationError } from "#system/migration-errors";
import type { AppliedMigrators, SessionSaveData, SystemSaveData } from "#types/save-data";
import type {
  SaveMigrator,
  SessionSaveMigrator,
  SessionSaveMigratorIn,
  SettingsSaveMigrator,
  SystemSaveMigrator,
  VersionString,
} from "#types/save-migrators";
import { getDataTypeKey } from "#utils/data";
import { compareVersions, isValidVersionString, validateIsArrayOfObjects } from "#utils/migrator-utils";

// #region Migrator Imports

// biome-ignore-start lint/performance/noNamespaceImport: Convenience (there's no need to worry about tree-shaking/etc here)

import * as v1_0_3 from "#system/v1_0_3";
import * as v1_0_4 from "#system/v1_0_4";
import * as v1_7_0 from "#system/v1_7_0";
import * as v1_8_3 from "#system/v1_8_3";
import * as v1_9_0 from "#system/v1_9_0";
import * as v1_10_0 from "#system/v1_10_0";
import * as v1_11_19 from "#system/v1_11_19";
import * as v1_12_0_0 from "#system/v1_12_0_0";
import * as v1_12_0_1 from "#system/v1_12_0_1";
import * as v1_12_0_3 from "#system/v1_12_0_3";
import * as v1_12_0_10 from "#system/v1_12_0_10";
import * as v1_12_1_0 from "#system/v1_12_1_0";

// biome-ignore-end lint/performance/noNamespaceImport: Convenience (there's no need to worry about tree-shaking/etc here)

// #endregion Migrator Imports

/*
// template for save migrator creation
// versions/vA_B_C_D.ts

// The version for each migrator should match the filename, e.g.: `vA_B_C_D.ts` -> `version: "A.B.C.D"
// This is the target version (aka the version we're ending up on after the migrators are run)

// The name for each migrator should match its purpose. For example, if you're fixing
// the ability index of a pokemon, it might be called `migratePokemonAbilityIndex`.
// Make sure the `name` field of the migrator matches the name of the const.

const systemMigratorA: SystemSaveMigrator = {
  name: "systemMigratorA",
  version: "A.B.C.D",
  migrate: (data): void => {
    // migration code goes here
  },
};

export const systemMigrators = [systemMigratorA] as const satisfies readonly SystemSaveMigrator[];

const sessionMigratorA: SessionSaveMigrator = {
  name: "sessionMigratorA",
  version: "A.B.C.D",
  migrate: (data): void => {
    // migration code goes here
  },
};

export const sessionMigrators = [sessionMigratorA] as const satisfies readonly SessionSaveMigrator[];

const settingsMigratorA: SettingsSaveMigrator = {
  name: "settingsMigratorA",
  version: "A.B.C.D",
  migrate: (data): void => {
    // migration code goes here
  },
};

export const settingsMigrators = [settingsMigratorA] as const satisfies readonly SettingsSaveMigrator[];
*/

/**
 * The current game version.
 * @remarks
 * This cannot be typed more strongly than `VersionString` because it is imported from `package.json`,
 * and TypeScript does not infer exact value types from JSON imports.
 */
const LATEST_VERSION = version as VersionString;

/** All system save migrators. */
const systemMigrators = [
  ...v1_0_3.systemMigrators,
  ...v1_0_4.systemMigrators,
  ...v1_7_0.systemMigrators,
  ...v1_8_3.systemMigrators,
  ...v1_12_0_0.systemMigrators,
  ...v1_12_0_1.systemMigrators,
  ...v1_12_0_3.systemMigrators,
  ...v1_12_0_10.systemMigrators,
  ...v1_12_1_0.systemMigrators,
] as const satisfies readonly SystemSaveMigrator[];

/** All session save migrators. */
const sessionMigrators = [
  ...v1_0_4.sessionMigrators,
  ...v1_7_0.sessionMigrators,
  ...v1_9_0.sessionMigrators,
  ...v1_10_0.sessionMigrators,
  ...v1_12_0_0.sessionMigrators,
] as const satisfies readonly SessionSaveMigrator[];

/** All settings migrators. */
const settingsMigrators = [
  ...v1_0_4.settingsMigrators,
  ...v1_11_19.settingsMigrators,
  ...v1_12_1_0.settingsMigrators,
] as const satisfies readonly SettingsSaveMigrator[];

// #region Migrator Sorting Typecheck Code

type MapToVersionNumbers<M extends readonly SaveMigrator[]> = M extends readonly [
  infer First extends SaveMigrator,
  ...infer Rest extends readonly SaveMigrator[],
]
  ? [First["version"], ...MapToVersionNumbers<Rest>]
  : [];

// Export the types for the migrator versions to be checked inside version-types.test-d.ts.

export type SystemMigratorVersions = MapToVersionNumbers<typeof systemMigrators>;
export type SessionMigratorVersions = MapToVersionNumbers<typeof sessionMigrators>;
export type SettingsMigratorVersions = MapToVersionNumbers<typeof settingsMigrators>;

// #endregion Migrator Sorting Typecheck Code

// #region Migration Functions

/**
 * Convert incoming {@linkcode SystemSaveData} that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The {@linkcode SystemSaveData} to migrate
 */
export function applySystemVersionMigration(data: SystemSaveData): void {
  const prevVersion = data.gameVersion;

  const isCurrentVersionHigher = compareVersions(LATEST_VERSION, prevVersion) > 0;
  if (isCurrentVersionHigher) {
    applyMigrators(systemMigrators, data, prevVersion);
    console.log(`System data successfully migrated to v${LATEST_VERSION}!`);
  }
}

/**
 * Convert incoming {@linkcode SessionSaveData} that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The {@linkcode SessionSaveData} to migrate
 */
export function applySessionVersionMigration(data: Record<string, unknown> | null): void {
  if (
    !data
    || typeof data !== "object"
    || typeof data.gameVersion !== "string"
    || !isValidVersionString(data.gameVersion)
  ) {
    console.warn("Session data is missing a valid gameVersion. Skipping migration.");
    return;
  }

  const isCurrentVersionHigher = compareVersions(LATEST_VERSION, data.gameVersion) > 0;
  if (isCurrentVersionHigher) {
    // Always sanitize money as a safeguard
    data.money = Math.floor(data.money as number);

    if (!validateIsArrayOfObjects(data.party)) {
      throw new SessionMigrationError("Session data is missing a valid party array. Cannot migrate.");
    }

    // Enemy party can be null due to some mystery encounters. Coerce to empty array before continuing
    if (data.enemyParty == null) {
      console.debug("Converting null enemyParty to empty array for migration.");
      data.enemyParty = [] satisfies Record<string, unknown>[];
    } else if (!validateIsArrayOfObjects(data.enemyParty)) {
      throw new SessionMigrationError("Session data has an invalid enemyParty array. Cannot migrate.");
    }

    applyMigrators(sessionMigrators, data as SessionSaveMigratorIn, data.gameVersion);
    console.log(`Session data successfully migrated to v${LATEST_VERSION}!`);
  }
}

/**
 * Convert incoming settings data that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The settings data object to migrate
 */
export function applySettingsVersionMigration(data: object): void {
  if (!data || typeof data !== "object") {
    console.warn("No valid settings data to migrate. Skipping settings migrators.");
    return;
  }

  const prevVersion: VersionString = data["gameVersion"] ?? data["meta"]["gameVersion"] ?? "1.0.0";

  const isCurrentVersionHigher = compareVersions(LATEST_VERSION, prevVersion) > 0;
  if (isCurrentVersionHigher) {
    applyMigrators(settingsMigrators, data, prevVersion);
    data["meta"]["gameVersion"] = LATEST_VERSION;
    localStorage.setItem(getDataTypeKey(GameDataType.SETTINGS), JSON.stringify(data));
    console.log(`Settings successfully migrated to v${LATEST_VERSION}!`);
  }
}

// #endregion Migration Functions

// #region Utility Functions
/**
 * Apply version migrators to the player's data.
 * @param migrators - The {@linkcode SaveMigrator}s to be applied
 * @param data - The data to migrate
 * @param saveVersion - The version of the save data
 */
function applyMigrators<D extends object>(
  migrators: readonly SaveMigrator<D>[],
  data: D,
  saveVersion: VersionString,
): void {
  for (const migrator of migrators) {
    if (compareVersions(migrator.version, saveVersion) > 0) {
      continue;
    }

    migrator.migrate(data);

    if ("appliedMigrators" in data) {
      const migratorNameVersion: keyof AppliedMigrators = `${migrator.version}-${migrator.name}`;
      (data.appliedMigrators as AppliedMigrators)[migratorNameVersion] = Date.now();
    }
  }
}

// #endregion Utility Functions
