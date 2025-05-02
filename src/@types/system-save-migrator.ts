import type { SystemSaveData } from "#app/system/game-data";

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
