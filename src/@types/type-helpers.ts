/*
 * A collection of custom utility types that aid in type checking and ensuring strict type conformity
 */

// biome-ignore-start lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { AbAttr } from "#abilities/ability";
// biome-ignore-end lint/correctness/noUnusedImports: Used in a tsdoc comment

import type { EnumValues } from "#types/enum-types";

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
export type InferKeys<O extends Record<keyof any, unknown>, V extends EnumValues<O>> = {
  [K in keyof O]: O[K] extends V ? K : never;
}[keyof O];

/**
 * Type helper for `Function` types. Equivalent to `Function`, but will not raise a warning in TypeScript.
 */
export type AnyFn = (...args: any[]) => any;

/**
 * Type helper to extract non-function properties from a type.
 *
 * @remarks
 * Useful to produce a type that is roughly the same as the type of `{... obj}`, where `obj` is an instance of `T`.
 * A couple of differences:
 * - Private and protected properties are not included.
 */
export type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends AnyFn ? never : K]: T[K];
};

/**
 * Type helper to extract out non-function properties from a type, recursively applying to nested properties.
 *
 */
export type NonFunctionPropertiesRecursive<Class> = {
  [K in keyof Class as Class[K] extends AnyFn ? never : K]: Class[K] extends Array<infer U>
    ? NonFunctionPropertiesRecursive<U>[]
    : Class[K] extends object
      ? NonFunctionPropertiesRecursive<Class[K]>
      : Class[K];
};
