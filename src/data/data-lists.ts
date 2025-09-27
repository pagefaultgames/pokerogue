import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { ModifierTypes } from "#modifiers/modifier-type";
import type { Move } from "#moves/move";

export const allAbilities: readonly Ability[] = [];
export const allMoves: readonly Move[] = [];
export const allSpecies: readonly PokemonSpecies[] = [];

// TODO: Figure out what this is used for and provide an appropriate tsdoc comment
export const modifierTypes = {} as ModifierTypes;
