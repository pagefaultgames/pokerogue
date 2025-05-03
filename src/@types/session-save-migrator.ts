import type { SessionSaveData } from "#app/system/game-data";

export interface SessionSaveMigrator {
  version: string;
  migrate: (data: SessionSaveData) => void;
}
