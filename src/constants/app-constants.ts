import type { SystemSaveData } from "#types/save-data";

/**
 * `true` if running in "development" mode which happens when:
 * - The build mode is "development" (`pnpm build:dev` which runs `vite build --mode development`) or
 * - The Vite server is started via `pnpm start:dev` (which runs `vite --mode development`)
 */
export const IS_DEV = import.meta.env.MODE === "development";

/**
 * `true` if running in "beta" mode which happens when:
 * - The build mode is "beta" (`pnpm build:beta` which runs `vite build --mode beta`) or
 * - The Vite server is started via `pnpm start:beta` (which runs `vite --mode beta`)
 */
export const IS_BETA = import.meta.env.MODE === "beta";

/** `true` if running via "app" mode (`pnpm build:app` which runs `vite build --mode app`) */
export const IS_APP = import.meta.env.MODE === "app";

export const BYPASS_LOGIN = import.meta.env.VITE_BYPASS_LOGIN === "1";

/** Whether to use seasonal splash messages in general */
export const USE_SEASONAL_SPLASH_MESSAGES: boolean = true;

/** Name of the session ID cookie */
export const SESSION_ID_COOKIE_NAME: string = "pokerogue_sessionId";

/** Key used to encrypt/decrypt save data */
export const SAVE_KEY = "x0i2O7WRiANTqPmZ";

/**
 * The chance (out of 1) that a different title logo will show when the title screen is drawn. \
 * Inverted during April Fools (such that this becomes the chance for the _normal_ title logo is displayed).
 */
export const FAKE_TITLE_LOGO_CHANCE = 10000;

/** Max value for an integer attribute in {@linkcode SystemSaveData} */
export const MAX_INT_ATTR_VALUE = 0x80000000;

export const MISSING_TEXTURE_KEY = "__MISSING";

export const SESSION_ID_KEY = "pokerogue_sessionId";
