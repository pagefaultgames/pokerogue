import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { MoveId } from "#enums/move-id";
import type { SpeciesId } from "#enums/species-id";
import type { ModifierTypes } from "#modifiers/modifier-type";
import type { Move } from "#moves/move";

export const allAbilities: Ability[] = [];
export const allMoves: Move[] = [];
export const allSpecies: PokemonSpecies[] = [];

// TODO: Figure out what this is used for and provide an appropriate tsdoc comment
export const modifierTypes = {} as ModifierTypes;

interface TmSpeciesList {
  [key: number]: (SpeciesId | (SpeciesId | string)[])[];
}

interface SpeciesTmList {
  [key: number]: (MoveId | [string | SpeciesId, MoveId])[];
}

export const tmSpeciesList: TmSpeciesList = {};
export const speciesTmList: SpeciesTmList = {};
