import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { SpeciesId } from "#enums/species-id";
import type { TimeOfDay } from "#enums/time-of-day";
import type { TrainerType } from "#enums/trainer-type";

// TODO: These interfaces should specify what enum key they use instead of simply using `number`

export interface BiomeLinks {
  [key: number]: BiomeId | (BiomeId | [BiomeId, number])[];
}

export interface BiomeDepths {
  [key: number]: [number, number];
}

// TODO: This field is assigned dynamically at runtime inside `BiomePokemonPools`.
// This is abhorrent.
export interface SpeciesTree {
  readonly [level: number]: SpeciesId[];
}

export interface BiomePokemonPools
  extends Readonly<
    Record<BiomeId, Readonly<Record<BiomePoolTier, Readonly<Record<TimeOfDay, (SpeciesId | SpeciesTree)[]>>>>>
  > {}

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
