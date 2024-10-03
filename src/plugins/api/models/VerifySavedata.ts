import type { SystemSaveData } from "#app/system/game-data";

export interface VerifySavedataResponse {
  valid: boolean;
  systemData: SystemSaveData;
}
