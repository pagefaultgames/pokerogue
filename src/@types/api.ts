import type { SessionSaveData, SystemSaveData } from "#types/save-data";

export interface UserInfo {
  username: string;
  lastSessionSlot: number;
  discordId: string;
  googleId: string;
  hasAdminRole: boolean;
}

export interface TitleStatsResponse {
  playerCount: number;
  battleCount: number;
}

// #region Account API

export interface AccountInfoResponse extends UserInfo {}

export interface AccountLoginRequest {
  username: string;
  password: string;
}

export interface AccountLoginResponse {
  token: string;
}

export interface AccountRegisterRequest {
  username: string;
  password: string;
}

export interface AccountChangePwRequest {
  password: string;
}
export interface AccountChangePwResponse {
  success: boolean;
}

// #endregion
// #region Admin API

export interface SearchAccountRequest {
  username: string;
}

export interface DiscordRequest extends SearchAccountRequest {
  discordId: string;
}

export interface GoogleRequest extends SearchAccountRequest {
  googleId: string;
}

export interface SearchAccountResponse {
  username: string;
  discordId: string;
  googleId: string;
  lastLoggedIn: string;
  registered: string;
  systemData?: SystemSaveData;
}

/** Third party login services */
export type AdminUiHandlerService = "discord" | "google";
/** Mode for the admin UI handler */
export type AdminUiHandlerServiceMode = "Link" | "Unlink";

export interface PokerogueAdminApiParams extends Record<AdminUiHandlerService, SearchAccountRequest> {
  discord: DiscordRequest;
  google: GoogleRequest;
}

// #endregion

export interface UpdateAllSavedataRequest {
  system: SystemSaveData;
  session: SessionSaveData;
  sessionSlotId: number;
  clientSessionId: string;
}

// #region Session Save API

export interface UpdateSessionSavedataRequest {
  slot: number;
  trainerId: number;
  secretId: number;
  clientSessionId: string;
}

/** This is **NOT** related to {@linkcode ClearSessionSavedataRequest}  */
export interface NewClearSessionSavedataRequest {
  slot: number;
  isVictory: boolean;
  clientSessionId: string;
}

export interface GetSessionSavedataRequest {
  slot: number;
  clientSessionId: string;
}

export interface DeleteSessionSavedataRequest {
  slot: number;
  clientSessionId: string;
}

/** This is **NOT** related to {@linkcode NewClearSessionSavedataRequest} */
export interface ClearSessionSavedataRequest {
  slot: number;
  trainerId: number;
  clientSessionId: string;
}

/** Pokerogue API response for path: `/savedata/session/clear` */
export interface ClearSessionSavedataResponse {
  /** Contains the error message if any occured */
  error?: string;
  /** Is `true` if the request was successfully processed */
  success?: boolean;
}

// #endregion
// #region System Save API

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

// #endregion
