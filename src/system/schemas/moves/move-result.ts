// biome-ignore lint/correctness/noUnusedImports: used in tsdoc comment
import type { MoveResult } from "#enums/move-result";
import { z } from "zod";

/**
 * Zod schema for the {@linkcode MoveResult} enum as of version 1.10
 */
export const Z$MoveResult = z.literal([0, 1, 2, 3, 4]);
