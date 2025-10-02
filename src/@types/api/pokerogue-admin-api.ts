import type { SystemSaveData } from "#types/save-data";

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
