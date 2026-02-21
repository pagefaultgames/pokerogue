import type { Ability } from "#abilities/ability";
import type { Biome } from "#data/biome";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { BiomeId } from "#enums/biome-id";
import type { ModifierTypes } from "#modifiers/modifier-type";
import type { Move } from "#moves/move";
import type { BiomeDepths, CatchableSpecies } from "#types/biomes";
import type { DataMap } from "#types/common";

export const allAbilities: readonly Ability[] = [];
export const allMoves: readonly Move[] = [];
export const allSpecies: readonly PokemonSpecies[] = [];

// TODO: Figure out what this is used for and provide an appropriate tsdoc comment
export const modifierTypes = {} as ModifierTypes;

export const catchableSpecies: CatchableSpecies = {} as CatchableSpecies;
export const biomeDepths: BiomeDepths = {};

export const allBiomes: DataMap<BiomeId, Biome> = new Map<BiomeId, Biome>() as DataMap<BiomeId, Biome>;
