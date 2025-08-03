export interface UpdateSessionSavedataRequest {
  slot: number;
  trainerId: number;
  secretId: number;
  clientSessionId: string;
}

/** This is **NOT** similar to {@linkcode ClearSessionSavedataRequest}  */
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

/** This is **NOT** similar to {@linkcode NewClearSessionSavedataRequest} */
export interface ClearSessionSavedataRequest {
  slot: number;
  trainerId: number;
  clientSessionId: string;
}

/**
 * Pokerogue API response for path: `/savedata/session/clear`
 */
export interface ClearSessionSavedataResponse {
  /** Contains the error message if any occured */
  error?: string;
  /** Is `true` if the request was successfully processed */
  success?: boolean;
}
