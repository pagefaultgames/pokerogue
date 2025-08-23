import type { SystemSaveData } from "#system/game-data";

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
