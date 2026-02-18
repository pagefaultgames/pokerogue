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

export type PokemonPools = Record<BiomePoolTier, SpeciesId[]>;
export type BiomePokemonPools = Readonly<
  Record<BiomeId, Readonly<Record<BiomePoolTier, Readonly<Record<TimeOfDay, SpeciesId[]>>>>>
>;

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
