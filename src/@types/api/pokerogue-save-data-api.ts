import type { SessionSaveData, SystemSaveData } from "#types/save-data";

export interface UpdateAllSavedataRequest {
  system: SystemSaveData;
  session: SessionSaveData;
  sessionSlotId: number;
  clientSessionId: string;
}
