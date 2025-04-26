/** The maximum size of the player's party */
export const PLAYER_PARTY_MAX_SIZE: number = 6;

/** Whether to use seasonal splash messages in general */
export const USE_SEASONAL_SPLASH_MESSAGES: boolean = true;

/** Name of the session ID cookie */
export const SESSION_ID_COOKIE_NAME: string = "pokerogue_sessionId";

/** Max value for an integer attribute in {@linkcode SystemSaveData} */
export const MAX_INT_ATTR_VALUE = 0x80000000;

/** The min and max waves for mystery encounters to spawn in classic mode */
export const CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES: [number, number] = [10, 180] as const;
/** The min and max waves for mystery encounters to spawn in challenge mode */
export const CHALLENGE_MODE_MYSTERY_ENCOUNTER_WAVES: [number, number] = [10, 180] as const;
