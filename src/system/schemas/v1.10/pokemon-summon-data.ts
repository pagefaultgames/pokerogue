import { Z$NonNegativeInt } from "#system/schemas/common";
import { Z$Gender } from "#system/schemas/v1.10/pokemon-gender";
import { Z$PokemonSpeciesForm } from "#system/schemas/v1.10/pokemon-species-form";
import { Z$StatSet } from "#system/schemas/v1.10/pokemon-stats";
import { Z$PokemonType } from "#system/schemas/v1.10/pokemon-type";
import { Z$TurnMove } from "#system/schemas/v1.10/turn-move";
import { z } from "zod";

const Z$StatStage = z.int().min(-6).max(6).catch(0);

const Z$StatStageSet = z.tuple([
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
]);

// Pre version 1.10 pokemon summon data migration needs to rename
// input fields

/**
 * Zod schema for Pokémon summon data as of version 1.10.
 *
 */
export const Z$PokemonSummonData = z.object({
  statStages: Z$StatStageSet.optional().catch(undefined),
  moveQueue: z.array(Z$TurnMove).optional().catch(undefined),
  // todo: tags
  abilitySuppressed: z.boolean().optional().catch(undefined),

  //#region Overrides for transform
  speciesForm: Z$PokemonSpeciesForm.nullable().catch(null),
  fusionSpeciesForm: Z$PokemonSpeciesForm.nullable().catch(null),
  ability: Z$NonNegativeInt.optional().catch(undefined),
  passiveAbility: Z$NonNegativeInt.optional().catch(undefined),
  gender: Z$Gender.optional().catch(undefined),
  fusionGender: Z$Gender.optional().catch(undefined),
  stats: Z$StatSet.optional().catch(undefined),
  moveset: z.array(Z$TurnMove).nullable().catch(null),
  //#endregion Overrides for transform

  types: z.array(Z$PokemonType).optional().catch(undefined),
  addedType: Z$PokemonType.nullable().catch(null),
});
