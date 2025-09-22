import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { SpeciesId } from "#enums/species-id";
import type { ModifierTypes } from "#modifiers/modifier-type";
import type { Move } from "#moves/move";
import type { BiomeDepths, CatchableSpecies } from "#types/biomes";

export const allAbilities: readonly Ability[] = [];
export const allMoves: readonly Move[] = [];
export const allSpecies: readonly PokemonSpecies[] = [];

// TODO: Figure out what this is used for and provide an appropriate tsdoc comment
export const modifierTypes = {} as ModifierTypes;

export const catchableSpecies: CatchableSpecies = {};
export const biomeDepths: BiomeDepths = {};
export const uncatchableSpecies: SpeciesId[] = [];
