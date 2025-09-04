// TODO: move this (and other global constants) to `src/constants/*-constants.ts`

/** `true` if running on `beta.pokerogue.net` or via `pnpm start:beta` (which runs `vite --mode beta`) */
export const isBeta = import.meta.env.MODE === "beta";
