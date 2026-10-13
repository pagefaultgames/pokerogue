// biome-ignore-all lint/performance/noNamespaceImport: Convenience (there's no need to worry about tree-shaking/etc here)

import { isBeta, isDev } from "#constants/app-constants";
import { GameDataType } from "#enums/game-data-type";
import { version } from "#package.json";
import { SessionMigrationError } from "#system/migration-errors";
import type { AppliedMigrators, SessionSaveData, SystemSaveData } from "#types/save-data";
import type {
  SessionSaveMigrator,
  SessionSaveMigratorIn,
  SettingsSaveMigrator,
  SystemSaveMigrator,
} from "#types/save-migrators";
import { getDataTypeKey } from "#utils/data";
import { compareVersions, validateIsArrayOfObjects } from "#utils/migrator-utils";

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

export const systemMigrators: readonly SystemSaveMigrator[] = [systemMigratorA] as const;

const sessionMigratorA: SessionSaveMigrator = {
  name: "sessionMigratorA",
  version: "A.B.C.D",
  migrate: (data): void => {
    // migration code goes here
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [sessionMigratorA] as const;

const settingsMigratorA: SettingsSaveMigrator = {
  name: "settingsMigratorA",
  version: "A.B.C.D",
  migrate: (data): void => {
    // migration code goes here
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [settingsMigratorA] as const;
*/

type SaveMigrator = SystemSaveMigrator | SessionSaveMigrator | SettingsSaveMigrator;
type SaveData = SystemSaveData | SessionSaveMigratorIn | object;

/** Current game version */
const LATEST_VERSION = version;

// #region Migrators

// Add migrator imports below

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

// To add a new set of migrators, add them to the appropriate array of migrators

/** All system save migrators */
const systemMigrators: SystemSaveMigrator[] = [
  ...v1_0_3.systemMigrators,
  ...v1_0_4.systemMigrators,
  ...v1_7_0.systemMigrators,
  ...v1_8_3.systemMigrators,
  ...v1_12_0_0.systemMigrators,
  ...v1_12_0_1.systemMigrators,
  ...v1_12_0_3.systemMigrators,
  ...v1_12_0_10.systemMigrators,
  ...v1_12_1_0.systemMigrators,
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
const settingsMigrators: SettingsSaveMigrator[] = [
  ...v1_0_4.settingsMigrators,
  ...v1_11_19.settingsMigrators,
  ...v1_12_1_0.settingsMigrators,
];

// Ensure the migrators are in the correct order so that they are consistently applied from oldest to newest
sortMigrators(systemMigrators);
sortMigrators(sessionMigrators);
sortMigrators(settingsMigrators);

// #endregion Migrators

// #region Migration Functions

/**
 * Converts incoming {@linkcode SystemSaveData} that has a version below the
 * current version number listed in `package.json` (or equal, on beta and dev instances).
 *
 * Note that no transforms act on the {@linkcode data} if its version matches
 * the current version or if there are no migrations made between its version up
 * to the current version.
 * @param data - The {@linkcode SystemSaveData} to migrate
 */
export function applySystemVersionMigration(data: SystemSaveData): void {
  const prevVersion = data.gameVersion;
  /*
   * Unlike other migrators, system save migrators can run on same-version saves
   * if the migrator hasn't been applied yet, on beta and dev instances.
   * This is done because migrators can be added over time while the client version stays the same,
   * whereas on main all migrators are added at once with a version increase.
   * Therefore, this checks that the current version is equal to or greater than the save's version,
   * instead of only checking that the current version is greater.
   *
   * Main will still only run migrators on saves that are older than the current version.
   */
  const isPreviousVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === 1;

  if (!isPreviousVersionHigher) {
    const numPrevMigratorsApplied = Object.keys(data.appliedMigrators).length;

    applyMigrators(systemMigrators, data, prevVersion);

    if (Object.keys(data.appliedMigrators).length > numPrevMigratorsApplied) {
      console.log(`System data successfully migrated to v${LATEST_VERSION}!`);
    } else {
      console.log("No system data migrators applied.");
    }
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
export function applySessionVersionMigration(data: Record<string, unknown>): void {
  if (!data || typeof data !== "object" || !("gameVersion" in data) || typeof data.gameVersion !== "string") {
    console.warn("Session data is missing a valid gameVersion. Skipping migration.");
    return;
  }
  const prevVersion = data.gameVersion;
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    // Always sanitize money as a safeguard
    data.money = Math.floor(data.money as number);

    if (!validateIsArrayOfObjects(data.party)) {
      throw new SessionMigrationError("Session data is missing a valid party array. Cannot migrate.");
    }

    // Enemy party can be null due to some mystery encounters. Coerce to empty array before continuing
    if (data.enemyParty == null) {
      console.debug("Converting null enemyParty to empty array for migration.");
      data.enemyParty = [];
    } else if (!validateIsArrayOfObjects(data.enemyParty)) {
      throw new SessionMigrationError("Session data has an invalid enemyParty array. Cannot migrate.");
    }

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
export function applySettingsVersionMigration(data: object): void {
  if (!data || typeof data !== "object") {
    console.warn("No valid settings data to migrate. Skipping settings migrators.");
    return;
  }

  const prevVersion: string = data["gameVersion"] ?? data["meta"]["gameVersion"] ?? "1.0.0";
  const isCurrentVersionHigher = compareVersions(prevVersion, LATEST_VERSION) === -1;

  if (isCurrentVersionHigher) {
    applyMigrators(settingsMigrators, data, prevVersion);

    data["meta"]["gameVersion"] = LATEST_VERSION;
    localStorage.setItem(getDataTypeKey(GameDataType.SETTINGS), JSON.stringify(data));

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
    const migratorNameVersion = `${migrator.version}-${migrator.name}`;

    if (isMigratorVersionHigher) {
      migrator.migrate(data as any);

      if ("appliedMigrators" in data) {
        (data.appliedMigrators as AppliedMigrators)[migratorNameVersion] = Date.now();
      }

      continue;
    }

    if (
      (isBeta || isDev) // exclude main just in case
      && saveVersion === migrator.version
      && "appliedMigrators" in data
      && !(data["appliedMigrators"] as AppliedMigrators)[migratorNameVersion]
    ) {
      migrator.migrate(data as any);

      (data.appliedMigrators as AppliedMigrators)[migratorNameVersion] = Date.now();
      console.log(`Applied same version migrator "${migrator.name}".`);
    }
  }
}

// #endregion Utility Functions
