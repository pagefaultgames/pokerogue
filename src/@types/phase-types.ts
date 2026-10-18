import type { Phase } from "#app/phase";
import type { PhaseConstructorMap } from "#app/phase-manager";
import type { Pokemon } from "#field/pokemon";
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

/**
 * Interface representing a Phase subject to dynamic speed-based ordering. \
 * All phases implementing this interface will be sorted in
 * ascending speed order if multiple are queued at once (unless explicitly forbidden).
 */
export interface DynamicPhase extends Phase {
  /**
   * @returns The {@linkcode Pokemon} associated with this Phase.
   * Must be static across the Phase's entire lifetime.
   * @remarks
   * The linked Pokemon's Speed stat will be used to determine the order of this Phase's execution.
   */
  getPokemon(): Pokemon;
}
