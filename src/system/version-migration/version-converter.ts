/** biome-ignore-all lint/performance/noNamespaceImport: Convenience */

import { version } from "#package.json";
import type { SessionSaveData, SystemSaveData } from "#system/game-data";
import type { SessionSaveMigrator } from "#types/session-save-migrator";
import type { SettingsSaveMigrator } from "#types/settings-save-migrator";
import type { SystemSaveMigrator } from "#types/system-save-migrator";
import { compareVersions } from "compare-versions";

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
  // biome-ignore lint/complexity/noBannedTypes: TODO - refactor settings
  migrate: (data: Object): void => {
    // migration code goes here
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [settingsMigratorA] as const;
*/

// Add migrator imports below:
// Example: import * as vA_B_C from "#system/vA_B_C";

import * as v1_0_4 from "#system/version-migration/versions/v1_0_4";
import * as v1_7_0 from "#system/version-migration/versions/v1_7_0";
import * as v1_8_3 from "#system/version-migration/versions/v1_8_3";
import * as v1_9_0 from "#system/version-migration/versions/v1_9_0";
import * as v1_10_0 from "#system/version-migration/versions/v1_10_0";

/** Current game version */
const LATEST_VERSION = version;

type SaveMigrator = SystemSaveMigrator | SessionSaveMigrator | SettingsSaveMigrator;

// biome-ignore lint/complexity/noBannedTypes: TODO - refactor settings
type SaveData = SystemSaveData | SessionSaveData | Object;

// To add a new set of migrators, create a new `.push()` line like so:
// `systemMigrators.push(...vA_B_C.systemMigrators);`

/** All system save migrators */
const systemMigrators: SystemSaveMigrator[] = [];
systemMigrators.push(...v1_0_4.systemMigrators);
systemMigrators.push(...v1_7_0.systemMigrators);
systemMigrators.push(...v1_8_3.systemMigrators);

/** All session save migrators */
const sessionMigrators: SessionSaveMigrator[] = [];
sessionMigrators.push(...v1_0_4.sessionMigrators);
sessionMigrators.push(...v1_7_0.sessionMigrators);
sessionMigrators.push(...v1_9_0.sessionMigrators);
sessionMigrators.push(...v1_10_0.sessionMigrators);

/** All settings migrators */
const settingsMigrators: SettingsSaveMigrator[] = [];
settingsMigrators.push(...v1_0_4.settingsMigrators);

/** Sorts migrators by their stated version, ensuring they are applied in order from oldest to newest */
const sortMigrators = (migrators: SaveMigrator[]): void => {
  migrators.sort((a, b) => compareVersions(a.version, b.version));
};

sortMigrators(systemMigrators);
sortMigrators(sessionMigrators);
sortMigrators(settingsMigrators);

const applyMigrators = (migrators: readonly SaveMigrator[], data: SaveData, saveVersion: string) => {
  for (const migrator of migrators) {
    const isMigratorVersionHigher = compareVersions(saveVersion, migrator.version) === -1;
    if (isMigratorVersionHigher) {
      migrator.migrate(data as any);
    }
  }
};

/**
 * Converts incoming {@linkcode SystemSaveData} that has a version below the
 * current version number listed in `package.json`.
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data {@linkcode SystemSaveData}
 * @see {@link SystemVersionConverter}
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
 * @param data {@linkcode SessionSaveData}
 * @see {@link SessionVersionConverter}
 */
export function applySessionVersionMigration(data: SessionSaveData) {
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
 * @param data Settings data object
 * @see {@link SettingsVersionConverter}
 */
// biome-ignore lint/complexity/noBannedTypes: TODO - refactor settings
export function applySettingsVersionMigration(data: Object) {
  const prevVersion: string = data.hasOwnProperty("gameVersion") ? data["gameVersion"] : "1.0.0";
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    applyMigrators(settingsMigrators, data, prevVersion);
    console.log(`Settings successfully migrated to v${LATEST_VERSION}!`);
  }
}
