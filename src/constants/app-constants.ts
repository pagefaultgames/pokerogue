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

export const IS_TEST = import.meta.env.MODE === "test";

export const BYPASS_LOGIN = import.meta.env.VITE_BYPASS_LOGIN === "1";
