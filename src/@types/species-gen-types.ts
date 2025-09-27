// biome-ignore lint/correctness/noUnusedImports: Used in TSDoc comment
import type { EvoLevelThresholdKind } from "#enums/evo-level-threshold-kind";
import type { SpeciesId } from "#enums/species-id";

/**
 * A tuple representing level thresholds for evolution based on encounter type.
 * - `strong`: The evo level for, say, a Gym Leader or Evil Admin, etc.
 * - `normal`: The evo level for a regular Trainer with average strength
 * - `wild`: The evo level for wild encounters
 *
 * @see {@linkcode EvoLevelThresholdKind}
 */
export type EvoLevelThreshold = [strong: number, normal: number, wild: number];

/**
 * Pokemon Evolution tuple type consisting of:
 * - `species`: The species of the Pokemon.
 * - `level`: The level at which the Pokemon evolves.
 */
export type EvolutionLevel = [species: SpeciesId, level: number];

/**
 * {@inheritdoc EvolutionLevel}
 */
export type EvolutionLevelWithThreshold = [species: SpeciesId, level: number, evoLevelThreshold?: EvoLevelThreshold];
