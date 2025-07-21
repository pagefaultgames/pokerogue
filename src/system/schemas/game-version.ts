import { z } from "zod";

/**
 * Zod schema matching a version string
 *
 * @remarks Equivalent to `z.string().regex(/^\d+\.\d+\.\d+$/)`
 */
export const Z$GameVersion = z.string().regex(/^\d+\.\d+\.\d+$/);
