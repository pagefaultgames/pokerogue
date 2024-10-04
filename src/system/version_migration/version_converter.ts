import { SessionSaveData, SystemSaveData } from "../game-data";
import { version } from "../../../package.json";

// --- v1.0.4 (and below) PATCHES --- //
import * as v1_0_4 from "./versions/v1_0_4";

const LATEST_VERSION = version.split(".").map(value => parseInt(value));

export function applySystemVersionMigration(data: SystemSaveData) {
  const curVersion = data.gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SystemVersionConverter();
    converter.applyMigration(data, curVersion);
  }
}

export function applySessionVersionMigration(data: SessionSaveData) {
  const curVersion = data.gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SessionVersionConverter();
    converter.applyMigration(data, curVersion);
  }
}

export function applySettingsVersionMigration(data: Object) {
  const gameVersion: string = data.hasOwnProperty("gameVersion") ? data["gameVersion"] : "1.0.0";
  const curVersion = gameVersion.split(".").map(value => parseInt(value));

  if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
    const converter = new SettingsVersionConverter();
    converter.applyMigration(data, curVersion);
  }
}

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

class SessionVersionConverter extends VersionConverter {
  override applyMigration(data: SessionSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    if (curMajor === 1) {
      if (curMinor === 0) {
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 session data migration!");
          this.callMigrators(data, v1_0_4.sessionMigrators);
        }
      }
    }

    console.log(`Session data successfully migrated to v${version}!`);
  }
}

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
    }

    console.log(`System data successfully migrated to v${version}!`);
  }
}

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
    }

    console.log(`System data successfully migrated to v${version}!`);
  }
}
