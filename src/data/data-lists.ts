import type { Ability } from "#abilities/ability";
import type { BiomeId } from "#enums/biome-id";
import type { HeldItemId } from "#enums/held-item-id";
import type { AllHeldItems } from "#items/all-held-items";
import type { AllTrainerItems } from "#items/all-trainer-items";
import type { Move } from "#moves/move";
import type { Biome, BiomeDepths, CatchableSpecies } from "#types/biomes";
import type { DataMap } from "#types/common";

export const allAbilities: readonly Ability[] = [];
export const allMoves: readonly Move[] = [];

export const allTrainerItems: AllTrainerItems = {} as AllTrainerItems;

export const catchableSpecies: CatchableSpecies = {} as CatchableSpecies;
export const biomeDepths: BiomeDepths = {};

export const allBiomes: DataMap<BiomeId, Biome> = new Map<BiomeId, Biome>() as DataMap<BiomeId, Biome>;

/**
 * Map of all held items, indexed by their {@linkcode HeldItemId | ID}.
 * @see {@linkcode AllHeldItems}
 */
export const allHeldItems: AllHeldItems = {} as AllHeldItems;

export const starterColors: { [key: string]: [string, string] } = {};
