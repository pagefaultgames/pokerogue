/*
 * A collection of custom utility types that aid in type checking and ensuring strict type conformity
 */

// biome-ignore-start lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { AbAttr } from "#abilities/ability";
// biome-ignore-end lint/correctness/noUnusedImports: Used in a tsdoc comment

/**
 * Exactly matches the type of the argument, preventing adding additional properties.
 *
 * ⚠️ Should never be used with `extends`, as this will nullify the exactness of the type.
 *
 * As an example, used to ensure that the parameters of {@linkcode AbAttr.canApply} and {@linkcode AbAttr.getTriggerMessage} are compatible with
 * the type of its {@linkcode AbAttr.apply | apply} method.
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
 * Remove `readonly` from all properties of the provided type.
 * @typeParam T - The type to make mutable.
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Type helper to obtain the keys associated with a given value inside a `const object`.
 * @typeParam O - The type of the object
 * @typeParam V - The type of one of O's values
 */
export type InferKeys<O extends Record<keyof any, unknown>, V extends ObjectValues<O>> = {
  [K in keyof O]: O[K] extends V ? K : never;
}[keyof O]; /**
 * Utility type to obtain the values of a given object.
 * This can be used to extract the enum values from a `const object`,
 * or convert an `enum` interface produced by `typeof Enum` into the union type representing its values.
 */
export type ObjectValues<E> = E[keyof E];
