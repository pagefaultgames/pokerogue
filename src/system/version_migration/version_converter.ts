import { SessionSaveData, SystemSaveData } from "../game-data";
import { version } from "../../../package.json";

// --- v1.0.4 (and below) PATCHES --- //
import * as v1_0_4 from "./versions/v1_0_4";

const LATEST_VERSION = version.split(".").map(value => parseInt(value));

export abstract class VersionConverter {
  constructor(data: any, gameVersion: string) {
    const curVersion = gameVersion.split(".").map(value => parseInt(value));
    if (!curVersion.every((value, index) => value === LATEST_VERSION[index])) {
      this.applyMigration(data, curVersion);
    }
  }

  callMigrators(data: any, migrationArr: readonly any[]) {
    for (const migrate of migrationArr) {
      migrate(data);
    }
  }

  abstract applyMigration(data: any, curVersion: number[]): void;
}

export class SessionVersionConverter extends VersionConverter {
  constructor(data: SessionSaveData, gameVersion: string) {
    super(data, gameVersion);
  }

  applyMigration(data: SessionSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 session data migration!");
          this.callMigrators(data, v1_0_4.sessionMigrators);
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

  applyMigration(data: SystemSaveData, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 system data migraton!");
          this.callMigrators(data, v1_0_4.systemMigrators);
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

  applyMigration(data: Object, curVersion: number[]): void {
    const [ curMajor, curMinor, curPatch ] = curVersion;

    switch (curMajor) {
    case 1:
      switch (curMinor) {
      case 0:
        if (curPatch <= 4) {
          console.log("Applying v1.0.4 settings data migraton!");
          this.callMigrators(data, v1_0_4.sessionMigrators);
        }
      default:
      }
    default:
    }
    console.log(`System data successfully migrated to v${version}!`);
  }
}
