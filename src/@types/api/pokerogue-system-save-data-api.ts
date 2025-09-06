import type { SystemSaveData } from "#types/save-data";

export interface GetSystemSavedataRequest {
  clientSessionId: string;
}

export interface UpdateSystemSavedataRequest {
  clientSessionId: string;
  trainerId?: number;
  secretId?: number;
}

export interface VerifySystemSavedataRequest {
  clientSessionId: string;
}

export interface VerifySystemSavedataResponse {
  valid: boolean;
  systemData: SystemSaveData;
}
