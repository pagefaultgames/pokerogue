import type { Pokemon } from "#app/field/pokemon";
import type { Phase } from "#app/phase";
import type { PhaseConstructorMap } from "#app/phase-manager";
import type { ObjectValues } from "#types/type-helpers";

// Intentionally [re-]export the types of everything in phase-manager, as this file is meant to be
// the centralized place for type definitions for the phase system.
export type * from "#app/phase-manager";

/** Map of phase names to constructors for said phase */
export type PhaseMap = {
  [K in keyof PhaseConstructorMap]: InstanceType<PhaseConstructorMap[K]>;
};

/** Union type of all phase constructors. */
export type PhaseClass = ObjectValues<PhaseConstructorMap>;

/** Union type of all phase names as strings. */
export type PhaseString = keyof PhaseMap;

/** Type for predicate functions operating on a specific type of {@linkcode Phase}. */
export type PhaseConditionFunc<T extends PhaseString> = (phase: PhaseMap[T]) => boolean;

/** Interface type representing the assumption that all phases with pokemon associated are dynamic */
export interface DynamicPhase extends Phase {
  getPokemon(): Pokemon;
}
