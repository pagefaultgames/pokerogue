import type { SessionSaveData, SystemSaveData } from "#types/save-data";

export interface SessionSaveMigrator {
  version: string;
  migrate: (data: SessionSaveData) => void;
}

export interface SettingsSaveMigrator {
  version: string;
  migrate: (data: object) => void;
}

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
