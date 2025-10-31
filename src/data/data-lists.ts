import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { SpeciesId } from "#enums/species-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
// biome-ignore lint/correctness/noUnusedImports: used in TSDoc comment
import type { AllHeldItems } from "#items/all-held-items";
import type { TrainerItem } from "#items/trainer-item";
import type { Move } from "#moves/move";
import type { BiomeDepths, CatchableSpecies } from "#types/biomes";

export const allAbilities: readonly Ability[] = [];
export const allMoves: readonly Move[] = [];
export const allSpecies: readonly PokemonSpecies[] = [];

//@ts-expect-error
export const allTrainerItems: Record<TrainerItemId, TrainerItem> = {};
// TODO: Figure out what this is used for and provide an appropriate tsdoc comment

export const catchableSpecies: CatchableSpecies = {};
export const biomeDepths: BiomeDepths = {};
export const uncatchableSpecies: SpeciesId[] = [];

/**
 * Map of all held items, indexed by their {@linkcode ItemID}
 * @see {@linkcode AllHeldItems}
 */
export const allHeldItems = {};
