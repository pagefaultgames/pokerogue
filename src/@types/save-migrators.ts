import type { SystemSaveData } from "#types/save-data";

export interface SessionSaveMigratorIn {
  gameVersion: string;
  // Using `key: string` allows us to avoid typescript complaints about property not existing.
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
