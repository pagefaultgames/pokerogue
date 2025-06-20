/*
 * A collection of custom utility types that aid in type checking and ensuring strict type conformity
 */

// biome-ignore lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { AbAttr } from "./ability-types";

/**
 * Exactly matches the type of the argument, preventing adding additional properties.
 *
 * ⚠️ Should never be used with `extends`, as this will nullify the exactness of the type.
 *
 * As an example, used to ensure that the parameters of {@linkcode AbAttr.canApply} and {@linkcode AbAttr.getTriggerMessage} are compatible with
 * the type of the apply method
 *
 * @typeParam T - The type to match exactly
 */
export type Exact<T> = {
  [K in keyof T]: T[K];
};

/**
 * Type hint that indicates that the type is intended to be closed to a specific shape.
 * Does not actually do anything special, is really just an alias for X.
 */
export type Closed<X> = X;

/**
 * Remove `readonly` from all properties of the provided type
 * @typeParam T - The type to make mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
