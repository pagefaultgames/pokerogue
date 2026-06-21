// biome-ignore-all lint/performance/noNamespaceImport: Convenience (there's no need to worry about tree-shaking/etc here)

import { version } from "#package.json";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { SessionSaveMigrator, SettingsSaveMigrator, SystemSaveMigrator } from "#types/save-migrators";

/*
// template for save migrator creation
// versions/vA_B_C.ts

// The version for each migrator should match the filename, ie: `vA_B_C.ts` -> `version: "A.B.C"
// This is the target version (aka the version we're ending up on after the migrators are run)

// The name for each migrator should match its purpose. For example, if you're fixing
// the ability index of a pokemon, it might be called `migratePokemonAbilityIndex`

const systemMigratorA: SystemSaveMigrator = {
  version: "A.B.C",
  migrate: (data: SystemSaveData): void => {
    // migration code goes here
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [systemMigratorA] as const;

const sessionMigratorA: SessionSaveMigrator = {
  version: "A.B.C",
  migrate: (data: SessionSaveData): void => {
    // migration code goes here
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [sessionMigratorA] as const;

const settingsMigratorA: SettingsSaveMigrator = {
  version: "A.B.C",
  migrate: (data: object): void => {
    // migration code goes here
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [settingsMigratorA] as const;
*/

type SaveMigrator = SystemSaveMigrator | SessionSaveMigrator | SettingsSaveMigrator;
type SaveData = SystemSaveData | SessionSaveData | object;

/** Current game version */
const LATEST_VERSION = version;

// #region Migrators

// Add migrator imports below

import * as v1_0_4 from "#system/v1_0_4";
import * as v1_7_0 from "#system/v1_7_0";
import * as v1_8_3 from "#system/v1_8_3";
import * as v1_9_0 from "#system/v1_9_0";
import * as v1_10_0 from "#system/v1_10_0";
import * as v1_11_19 from "#system/v1_11_19";
import * as v1_12_0_0 from "#system/v1_12_0_0";

// To add a new set of migrators, add them to the appropriate array of migrators

/** All system save migrators */
const systemMigrators: SystemSaveMigrator[] = [
  ...v1_0_4.systemMigrators,
  ...v1_7_0.systemMigrators,
  ...v1_8_3.systemMigrators,
  ...v1_12_0_0.systemMigrators,
];

/** All session save migrators */
const sessionMigrators: SessionSaveMigrator[] = [
  ...v1_0_4.sessionMigrators,
  ...v1_7_0.sessionMigrators,
  ...v1_9_0.sessionMigrators,
  ...v1_10_0.sessionMigrators,
  ...v1_12_0_0.sessionMigrators,
];

/** All settings migrators */
const settingsMigrators: SettingsSaveMigrator[] = [...v1_0_4.settingsMigrators, ...v1_11_19.settingsMigrators];

// Ensure the migrators are in the correct order so that they are consistently applied from oldest to newest
sortMigrators(systemMigrators);
sortMigrators(sessionMigrators);
sortMigrators(settingsMigrators);

// #endregion Migrators

// #region Migration Functions

/**
 * Converts incoming {@linkcode SystemSaveData} that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The {@linkcode SystemSaveData} to migrate
 */
export function applySystemVersionMigration(data: SystemSaveData) {
  const prevVersion = data.gameVersion;
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    applyMigrators(systemMigrators, data, prevVersion);
    console.log(`System data successfully migrated to v${LATEST_VERSION}!`);
  }
}

/**
 * Converts incoming {@linkcode SessionSavaData} that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The {@linkcode SessionSaveData} to migrate
 */
export function applySessionVersionMigration(data: SessionSaveData) {
  if (!data || typeof data !== "object" || !("gameVersion" in data) || typeof data.gameVersion !== "string") {
    console.warn("Session data is missing a valid gameVersion. Skipping migration.");
    return;
  }
  const prevVersion = data.gameVersion;
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    // Always sanitize money as a safeguard
    data.money = Math.floor(data.money);

    applyMigrators(sessionMigrators, data, prevVersion);
    console.log(`Session data successfully migrated to v${LATEST_VERSION}!`);
  }
}

/**
 * Converts incoming settings data that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The settings data object to migrate
 */
export function applySettingsVersionMigration(data: object) {
  const prevVersion: string = Object.hasOwn(data, "gameVersion") ? data["gameVersion"] : "1.0.0";
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    applyMigrators(settingsMigrators, data, prevVersion);
    console.log(`Settings successfully migrated to v${LATEST_VERSION}!`);
  }
}

// #endregion Migration Functions

// #region Utility Functions

/** Sorts migrators by their stated version */
function sortMigrators(migrators: SaveMigrator[]): void {
  migrators.sort((a, b) => compareVersions(a.version, b.version));
}

/**
 * Applies version migrators to the player's save data.
 * @param migrators - The {@linkcode SaveMigrator}s to be applied
 * @param data - The {@linkcode SaveData} to migrate
 * @param saveVersion - The version of the save data
 */
function applyMigrators(migrators: readonly SaveMigrator[], data: SaveData, saveVersion: string): void {
  for (const migrator of migrators) {
    const isMigratorVersionHigher = compareVersions(saveVersion, migrator.version) === -1;
    if (isMigratorVersionHigher) {
      migrator.migrate(data as any);
    }
  }
}

/**
 * Converts a version string into an array of numbers for use in the comparison function.
 * @param versionString - The version to convert
 * @returns An array of numbers corresponding to the input version
 * @throws An error if the version string is not valid (of the form "#.#.#[.#]")
 * @example
 * ```ts
 * extractVersion("1.2.3"); // output: [1, 2, 3, 0]
 * extractVersion("1.2.3.4"); // output: [1, 2, 3, 4]
 * extractVersion("1..2.3"); // throws error
 * extractVersion("1.2.3.4.5"); // throws error
 * ```
 */
function extractVersion(versionString: string): number[] {
  // https://regex101.com/r/7r1299/1
  const regex = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
  if (!regex.test(versionString)) {
    throw new Error(`Invalid version string (${versionString}) in version migrator!`);
  }

  const versionArray = versionString.split(".").map(v => Number.parseInt(v));
  if (versionArray.length === 3) {
    versionArray.push(0);
  }
  return versionArray;
}

/**
 * Compares two versions and returns whether one is newer than the other.
 * @param versionA - The first version to compare
 * @param versionB - The second version to compare
 * @returns The result of the comparison:
 * - `1`: `versionA` is newer
 * - `-1`: `versionB` is newer
 * - `0`: The versions are equal
 */
function compareVersions(versionA: string, versionB: string): -1 | 0 | 1 {
  const a = extractVersion(versionA);
  const b = extractVersion(versionB);

  for (let i = 0; i < 4; i++) {
    if (a[i] > b[i]) {
      return 1;
    }
    if (a[i] < b[i]) {
      return -1;
    }
  }

  return 0;
}

// #endregion Utility Functions
