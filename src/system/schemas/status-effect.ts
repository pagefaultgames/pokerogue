// biome-ignore lint/correctness/noUnusedImports: used in tsdoc comment
import type { Status } from "#data/status-effect";
import { StatusEffect } from "#enums/status-effect";
import { z } from "zod";
import { Z$NonNegativeInt, Z$PositiveInt } from "../common";

/**
 * Zod schema for the {@linkcode StatusEffect} enum
 *
 * @remarks
 * - `0`: NONE,
 * - `1`: POISON,
 * - `2`: TOXIC,
 * - `3`: PARALYSIS,
 * - `4`: SLEEP,
 * - `5`: FREEZE,
 * - `6`: BURN,
 * - `7`: FAINT
 */
const Z$StatusEffect = z.int().min(StatusEffect.NONE).max(StatusEffect.FAINT).catch(StatusEffect.NONE);

// Note: This does not validate that sleepTurnsRemaining exists when effect is SLEEP.
// This is game logic that should perhaps exist in the constructor.
/**
 * Zod schema for the {@linkcode Status} class
 */
export const StatusSchema = z.object({
  effect: Z$StatusEffect,
  toxicTurnCount: Z$NonNegativeInt.catch(0),
  sleepTurnsRemaining: Z$PositiveInt.optional().catch(0),
});
