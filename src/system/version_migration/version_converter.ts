import { SessionSaveData, SystemSaveData } from "../game-data";
import { version } from "../../../package.json";

// --- v1.0.4 (and below) PATCHES --- //
import * as v1_0_4SessionData from "./v1_0_4/session_migrators";
import * as v1_0_4SystemData from "./v1_0_4/system_migrators";
import * as v1_0_4SettingsData from "./v1_0_4/settings_migrators";

const LATEST_VERSION = version.split(".").map(value => parseInt(value));

export abstract class VersionConverter {
  constructor(data: any, gameVersion: string) {
    const curVersion = gameVersion.split(".").map(value => parseInt(value));
    if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
      this.applyPatches(data, curVersion);
    }
  }

  callMigrators(data: any, migrationObject: Object) {
    const migrators = Object.values(migrationObject);
    for (const migrate of migrators) {
      migrate(data);
    }
  }

    abstract applyPatches(data: any, curVersion: number[]): void;
}

export class SessionVersionConverter extends VersionConverter {
  constructor(data: SessionSaveData, gameVersion: string) {
    super(data, gameVersion);
  }

  applyPatches(data: SessionSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 session data migration!");
          this.callMigrators(data, v1_0_4SessionData);
        }
      default:
      }
    default:
    }
    console.log(`Session data successfully migrated to v${version}!`);
  }
}

export class SystemVersionConverter extends VersionConverter {
  constructor(data: SystemSaveData, gameVersion: string) {
    super(data, gameVersion);
  }

  applyPatches(data: SystemSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 system data migraton!");
          this.callMigrators(data, v1_0_4SystemData);
        }
      default:
      }
    default:
    }
    console.log(`System data successfully migrated to v${version}!`);
  }
}

export class SettingsVersionConverter extends VersionConverter {
  constructor(data: SystemSaveData) {
    const gameVersion = data.hasOwnProperty("gameVersion") ? data["gameVersion"] : "1.0.0";
    super(data, gameVersion);
  }

  applyPatches(data: Object, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 settings data migraton!");
          this.callMigrators(data, v1_0_4SettingsData);
        }
      default:
      }
    default:
    }
    console.log(`System data successfully migrated to v${version}!`);
  }
}
