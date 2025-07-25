import type { SessionSaveData } from "#system/game-data";

export interface SessionSaveMigrator {
  version: string;
  migrate: (data: SessionSaveData) => void;
}
