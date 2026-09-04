export type ResetCodes = Record<string, string>;
export interface ResetCode {
  username: string;
  resetCode: string;
}

export const resetCodesLsKey = "resetCodes" as const;

/**
 * Sets the reset code for a given username in local storage.
 * @param username The username for which to set the reset code
 * @param resetCode The reset code to set for the given username
 */
export function setResetCode(username: string, resetCode: string): void {
  const resetCodes: ResetCodes = JSON.parse(localStorage.getItem(resetCodesLsKey) ?? "{}");
  resetCodes[username] = resetCode;
  localStorage.setItem(resetCodesLsKey, JSON.stringify(resetCodes));
}

/**
 * Gets the reset codes from local storage.
 * @returns An object mapping usernames to their corresponding reset codes
 */
export function getResetCodes(): ResetCode[] {
  const resetCodes: ResetCodes = JSON.parse(localStorage.getItem(resetCodesLsKey) ?? "{}");
  return Object.entries(resetCodes).map(([username, resetCode]) => ({ username, resetCode }));
}
