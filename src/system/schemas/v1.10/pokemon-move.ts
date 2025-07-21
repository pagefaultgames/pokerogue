import { z } from "zod";


/**
 * Zod schema for a Pokémon move, as of version 1.10.
 */
export const Z$PokemonMove = z.object({
  moveId: z.number().int().min(0), // Move ID, default to 0
  ppUsed: z.number().int().default(0).catch(0), // PP used, default to 0
  ppUp: z.number().int().default(0).catch(0), // PP Up count, default to 0
  maxPpOverride: z.int().min(1).optional(), // Optional max PP override, can be null
});

// If necessary, we can define `transforms` which implicitly create an instance of the class.

export type ParsedPokemonMove = z.output<typeof Z$PokemonMove>;

