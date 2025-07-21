import { Z$BerryType } from "#schemas/berry-type";
import { Z$NonNegativeInt } from "#schemas/common";
import { z } from "zod";

/**
 * Zod schema for Pokémon battle data as of version 1.10.
 *
 * @remarks
 * All fields are optional and fallback to undefined if malformed, as `BattleData`'s
 * constructor supports taking partial data, and using defaults for missing fields.
 */
export const Z$PokemonBattleData = z.object({
  hitCount: Z$NonNegativeInt.optional().catch(undefined),
  hasEatenBerry: z.boolean().optional().catch(undefined),
  berriesEaten: z.array(Z$BerryType).optional().catch(undefined),
});

export type ParsedPokemonBattleData = z.output<typeof Z$PokemonBattleData>;
