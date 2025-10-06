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
interface SpeciesTree {
  [key: number]: SpeciesId[];
}

export interface PokemonPools {
  [key: number]: (SpeciesId | SpeciesTree)[];
}
interface BiomeTierPokemonPools {
  [key: number]: PokemonPools;
}
export interface BiomePokemonPools {
  [key: number]: BiomeTierPokemonPools;
}

export interface BiomeTierTod {
  biome: BiomeId;
  tier: BiomePoolTier;
  tod: TimeOfDay[];
}

export interface CatchableSpecies {
  [key: number]: BiomeTierTod[];
}

export interface BiomeTierTrainerPools {
  [key: number]: TrainerType[];
}

export interface BiomeTrainerPools {
  [key: number]: BiomeTierTrainerPools;
}
