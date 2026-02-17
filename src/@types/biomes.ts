import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { SpeciesId } from "#enums/species-id";
import type { TimeOfDay } from "#enums/time-of-day";
import type { TrainerType } from "#enums/trainer-type";

export interface BiomeLinks {
  [key: number]: BiomeId | (BiomeId | [BiomeId, number])[];
}

export interface BiomeDepths {
  [key: number]: [number, number];
}

// TODO: This field is assigned dynamically at runtime inside `BiomePokemonPools`.
// This is abhorrent and should be revisited.
export interface SpeciesTree {
  readonly [level: number]: SpeciesId[];
}

export type PokemonPools = Readonly<Record<TimeOfDay, (SpeciesId | SpeciesTree)[]>>;

export type BiomePokemonPools = Readonly<Record<BiomeId, Readonly<Record<BiomePoolTier, PokemonPools>>>>;

export interface BiomeTierTod {
  biome: BiomeId;
  tier: BiomePoolTier;
  tod: TimeOfDay[];
}

export interface CatchableSpecies {
  readonly [key: number]: readonly BiomeTierTod[];
}

export interface BiomeTierTrainerPools {
  readonly [key: number]: readonly TrainerType[];
}

export interface BiomeTrainerPools {
  readonly [key: number]: BiomeTierTrainerPools;
}
