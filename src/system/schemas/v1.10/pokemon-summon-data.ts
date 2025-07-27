import { Z$NonNegativeInt } from "#system/schemas/common";
import { Z$Gender } from "#system/schemas/v1.10/pokemon-gender";
import { Z$PokemonMove } from "#system/schemas/v1.10/pokemon-move";
import { Z$StatSet } from "#system/schemas/v1.10/pokemon-stats";
import { Z$PokemonType } from "#system/schemas/v1.10/pokemon-type";
import { Z$TurnMove } from "#system/schemas/v1.10/turn-move";
import { z } from "zod";

export const Z$SerializedSpeciesForm = z.object({
  id: Z$NonNegativeInt,
  formIndex: Z$NonNegativeInt.catch(0),
});

/**
 * Zod schema for Pokémon summon data as of version 1.10.
 *
 * @remarks
 * All fields other than `stats` are optional, and catch to `undefined` on parse error,
 * allowing {@linkcode PokemonSummonData} to fill in defaults.
 * 
 */
export const Z$PokemonSummonData = z.object({
  statSages: z.array(z.int().min(-6).max(6).catch(0)).optional().catch(undefined),
  moveQueue: z.array(Z$TurnMove).optional().catch(undefined),
  abilitySuppressed: z.boolean().optional().catch(undefined),
  speciesForm: Z$SerializedSpeciesForm.optional().catch(undefined),
  ability: Z$NonNegativeInt.optional().catch(undefined),
  passiveAbility: Z$NonNegativeInt.optional().catch(undefined),
  gender: Z$Gender.optional().catch(undefined),
  fusionGender: Z$Gender.optional().catch(undefined),
  stats: Z$StatSet,
  moveset: z.array(Z$PokemonMove).optional().catch(undefined),
  types: z.array(Z$PokemonType).optional().catch(undefined),
  addedType: Z$PokemonType.optional().catch(undefined),
  illusion
});
