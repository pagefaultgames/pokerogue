import type { SystemSaveData } from "./save-data";

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
