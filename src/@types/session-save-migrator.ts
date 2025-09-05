import type { SessionSaveData } from "./data-types";

export interface SessionSaveMigrator {
  version: string;
  migrate: (data: SessionSaveData) => void;
}
