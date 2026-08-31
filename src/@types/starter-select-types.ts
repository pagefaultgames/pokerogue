import type { PokemonType } from "#enums/pokemon-type";
import type { Variant } from "#sprites/variant";
import type { SetNonNullable } from "type-fest";

export interface SpeciesDetails {
  shiny?: boolean | undefined;
  formIndex?: number | undefined;
  female?: boolean | undefined;
  variant?: Variant | undefined;
  abilityIndex?: number | undefined;
  natureIndex?: number | undefined;
  teraType?: PokemonType | undefined;
}

export type DefinedSpeciesDetails = Required<SetNonNullable<SpeciesDetails>>;

export interface CanCycle {
  ability: boolean;
  form: boolean;
  gender: boolean;
  shiny: boolean;
  nature: boolean;
  tera: boolean;
}
