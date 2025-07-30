import { Z$NonNegativeInt, Z$PositiveInt, Z$PositiveNumber } from "#system/schemas/common";
import { Z$PokemonType } from "#system/schemas/pokemon/pokemon-type";
import { z } from "zod";

export const Z$PokemonSpeciesForm = z.object({
  speciesId: Z$PositiveInt,
  _formIndex: Z$NonNegativeInt.catch(0),
  _generation: Z$PositiveInt.catch(1),
  type1: Z$PokemonType,
  type2: Z$PokemonType.nullable().catch(null),
  height: Z$PositiveNumber,
  weight: Z$PositiveNumber,
  ability: Z$NonNegativeInt,
  ability2: Z$NonNegativeInt,
  abilityHidden: Z$NonNegativeInt,
  baseTotal: Z$PositiveInt,
  baseStats: z.tuple([
    Z$PositiveInt, // hp
    Z$PositiveInt, // atk
    Z$PositiveInt, // def
    Z$PositiveInt, // spa
    Z$PositiveInt, // spd
    Z$PositiveInt, // spe
  ]),
  catchRate: z.int().min(0).max(255),
  baseFriendship: Z$NonNegativeInt,
  baseExp: Z$PositiveInt,
  genderDiffs: z.boolean(),
  isStarterSelectable: z.boolean(),
});
