import { SessionSaveData, SystemSaveData } from "../game-data";
import { version } from "../../../package.json";

// --- v1.0.4 (and below) PATCHES --- //
import * as v1_0_4 from "./versions/v1_0_4";

// --- v1.1.0 PATCHES --- //
import * as v1_1_0 from "./versions/v1_1_0";

const LATEST_VERSION = version.split(".").map(value => parseInt(value));

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
  const curVersion = data.gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SystemVersionConverter();
    converter.applyStaticPreprocessors(data);
    converter.applyMigration(data, curVersion);
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
  const curVersion = data.gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SessionVersionConverter();
    converter.applyStaticPreprocessors(data);
    converter.applyMigration(data, curVersion);
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
export function applySettingsVersionMigration(data: Object) {
  const gameVersion: string = data.hasOwnProperty("gameVersion") ? data["gameVersion"] : "1.0.0";
  const curVersion = gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SettingsVersionConverter();
    converter.applyStaticPreprocessors(data);
    converter.applyMigration(data, curVersion);
  }
}

/**
 * Abstract class encapsulating the logic for migrating data from a given version up to
 * the current version listed in `package.json`.
 *
 * Note that, for any version converter, the corresponding `applyMigration`
 * function would only need to be changed once when the first migration for a
 * given version is introduced. Similarly, a version file (within the `versions`
 * folder) would only need to be created for a version once with the appropriate
 * array nomenclature.
 */
abstract class VersionConverter {
  /**
   * Iterates through an array of designated migration functions that are each
   * called one by one to transform the data.
   * @param data The data to be operated on
   * @param migrationArr An array of functions that will transform the incoming data
   */
  callMigrators(data: any, migrationArr: readonly any[]) {
    for (const migrate of migrationArr) {
      migrate(data);
    }
  }

  /**
   * Applies any version-agnostic data sanitation as defined within the function
   * body.
   * @param data The data to be operated on
   */
  applyStaticPreprocessors(_data: any): void {
  }

  /**
   * Uses the current version the incoming data to determine the starting point
   * of the migration which will cascade up to the latest version, calling the
   * necessary migration functions in the process.
   * @param data The data to be operated on
   * @param curVersion [0] Current major version
   *                   [1] Current minor version
   *                   [2] Current patch version
   */
  abstract applyMigration(data: any, curVersion: number[]): void;
}

/**
 * Class encapsulating the logic for migrating {@linkcode SessionSaveData} from
 * a given version up to the current version listed in `package.json`.
 * @extends VersionConverter
 */
class SessionVersionConverter extends VersionConverter {
  override applyStaticPreprocessors(data: SessionSaveData): void {
    // Always sanitize money as a safeguard
    data.money = Math.floor(data.money);
  }

  override applyMigration(data: SessionSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    if (curMajor === 1) {
      if (curMinor === 0) {
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 session data migration!");
          this.callMigrators(data, v1_0_4.sessionMigrators);
        }
      }
      if (curMinor <= 1) {
        console.log("Applying v1.1.0 session data migration!");
        this.callMigrators(data, v1_1_0.sessionMigrators);
      }
    }

    console.log(`Session data successfully migrated to v${version}!`);
  }
}

/**
 * Class encapsulating the logic for migrating {@linkcode SystemSaveData} from
 * a given version up to the current version listed in `package.json`.
 * @extends VersionConverter
 */
class SystemVersionConverter extends VersionConverter {
  override applyMigration(data: SystemSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    if (curMajor === 1) {
      if (curMinor === 0) {
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 system data migraton!");
          this.callMigrators(data, v1_0_4.systemMigrators);
        }
      }
      if (curMinor <= 1) {
        console.log("Applying v1.1.0 system data migraton!");
        this.callMigrators(data, v1_1_0.systemMigrators);
      }
    }

    console.log(`System data successfully migrated to v${version}!`);
  }
}

/**
 * Class encapsulating the logic for migrating settings data from
 * a given version up to the current version listed in `package.json`.
 * @extends VersionConverter
 */
class SettingsVersionConverter extends VersionConverter {
  override applyMigration(data: Object, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    if (curMajor === 1) {
      if (curMinor === 0) {
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 settings data migraton!");
          this.callMigrators(data, v1_0_4.settingsMigrators);
        }
      }
      if (curMinor <= 1) {
        console.log("Applying v1.1.0 settings data migraton!");
        this.callMigrators(data, v1_1_0.settingsMigrators);
      }
    }

    console.log(`System data successfully migrated to v${version}!`);
  }
}
