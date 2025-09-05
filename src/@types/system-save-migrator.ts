import type { SystemSaveData } from "./data-types";

export interface SystemSaveMigrator {
  version: string;
  migrate: (data: SystemSaveData) => void;
}
