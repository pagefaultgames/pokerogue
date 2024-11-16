import type { SessionSaveData, SystemSaveData } from "#app/system/game-data";

export interface UpdateAllSavedataRequest {
  system: SystemSaveData;
  session: SessionSaveData;
  sessionSlotId: number;
  clientSessionId: string;
}
