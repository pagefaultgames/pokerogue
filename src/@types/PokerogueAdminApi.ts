export interface LinkAccountToDiscordIdRequest {
  username: string;
  discordId: string;
}

export interface UnlinkAccountFromDiscordIdRequest {
  username: string;
  discordId: string;
}

export interface LinkAccountToGoogledIdRequest {
  username: string;
  googleId: string;
}

export interface UnlinkAccountFromGoogledIdRequest {
  username: string;
  googleId: string;
}

export interface SearchAccountRequest {
  username: string;
}

export interface SearchAccountResponse {
  username: string;
  discordId: string;
  googleId: string;
  lastLoggedIn: string;
  registered: string;
}
