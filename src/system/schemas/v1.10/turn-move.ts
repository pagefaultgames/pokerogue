// biome-ignore-start lint/correctness/noUnusedImports: used in tsdoc comment
import type { MoveUseMode } from "#enums/move-use-mode";
import type { TurnMove } from "#types/turn-move";
// biome-ignore-end lint/correctness/noUnusedImports: used in tsdoc comment

import { Z$NonNegativeInt, Z$PositiveInt } from "#system/schemas/common";
import { Z$BattlerIndex } from "#system/schemas/v1.10/battler-index";
import { Z$MoveResult } from "#system/schemas/v1.10/move-result";
import { z } from "zod";

/**
 * Zod schema for the {@linkcode MoveUseMode} enum
 */
export const Z$MoveUseMode = z.literal([1, 2, 3, 4, 5]);

/**
 * Zod schema for `{@linkcode TurnMove} as of version 1.10.
 */
export const Z$TurnMove = z.object({
    move: Z$PositiveInt,
    targets: z.array(Z$BattlerIndex),
    useMode: Z$MoveUseMode,
    result: Z$MoveResult.optional().catch(undefined),
    turn: Z$NonNegativeInt.optional().catch(undefined)
});
