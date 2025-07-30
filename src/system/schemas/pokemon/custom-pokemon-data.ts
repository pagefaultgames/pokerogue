import { Z$OptionalNonNegativeIntCatchToUndef, Z$PositiveInt } from "#schemas/common";
import { Z$PokemonType } from "#system/schemas/pokemon/pokemon-type";
import { z } from "zod";

/**
 * Zod schema for custom Pokémon data as of version 1.10.
 *
 * @remarks All fields are optional, but catch to `undefined`
 * on malformed inputs, as the `CustomPokemonData` allows partial data and
 * uses defaults for missing fields.
 */
export const Z$CustomPokemonData = z.object({
  // sprite scale of -1 is allowed, but it's the default meaning there is no override for it
  spriteScale: z.number().nonnegative().optional().catch(undefined),
  ability: Z$OptionalNonNegativeIntCatchToUndef,
  passive: Z$OptionalNonNegativeIntCatchToUndef,
  nature: Z$OptionalNonNegativeIntCatchToUndef,
  types: z.array(Z$PokemonType).optional().catch(undefined),
  hitsRecCount: Z$PositiveInt.optional().catch(undefined),
});
