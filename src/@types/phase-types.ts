import type { PhaseConstructorMap } from "#app/phase-manager";
import type { ObjectValues } from "#types/type-helpers";

// Intentionally export the types of everything in phase-manager, as this file is meant to be
// the centralized place for type definitions for the phase system.
export type * from "#app/phase-manager";

// This file includes helpful types for the phase system.
// It intentionally imports the phase constructor map from the phase manager (and re-exports it)

/**
 * Map of phase names to constructors for said phase
 */
export type PhaseMap = {
  [K in keyof PhaseConstructorMap]: InstanceType<PhaseConstructorMap[K]>;
};

/**
 * Union type of all phase constructors.
 */
export type PhaseClass = ObjectValues<PhaseConstructorMap>;

/**
 * Union type of all phase names as strings.
 */
export type PhaseString = keyof PhaseMap;
