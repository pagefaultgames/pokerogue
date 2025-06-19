import type PokemonSpecies from "#app/data/pokemon-species";
import type { ModifierTypes } from "#app/modifier/modifier-type";
import type { Ability } from "./abilities/ability";
import type Move from "./moves/move";

export const allAbilities: Ability[] = [];
export const allMoves: Move[] = [];
export const allSpecies: PokemonSpecies[] = [];

// TODO: Figure out what this is used for and provide an appropriate tsdoc comment
export const modifierTypes = {} as ModifierTypes;
