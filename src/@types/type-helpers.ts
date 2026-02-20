/*
 * A collection of custom utility types that aid in type checking and ensuring strict type conformity
 */

import type { AbAttr } from "#abilities/ab-attrs";
import type { IntClosedRange, NegativeInfinity, PositiveInfinity, TupleOf } from "type-fest";

/**
 * Exactly matches the type of the argument, preventing adding additional properties.
 *
 * ⚠️ Should never be used with `extends`, as this will nullify the exactness of the type.
 *
 * As an example, used to ensure that the parameters of {@linkcode AbAttr.canApply} and {@linkcode AbAttr.getTriggerMessage}
 * are compatible with the type of its {@linkcode AbAttr.apply | apply} method.
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
 * Helper type to strip `readonly` from all properties of the provided type.
 * Inverse of {@linkcode Readonly}
 * @typeParam T - The type to make mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Type helper to obtain the keys associated with a given value inside an object. \
 * Functions similarly to `Pick`, but checking assignability of values instead of keys.
 * @typeParam O - The type of the object
 * @typeParam V - The type of one of O's values.
 */
export type InferKeys<O extends object, V> = {
  [K in keyof O]: O[K] extends V ? K : never;
}[keyof O];

/**
 * Utility type to obtain a union of the values of a given object. \
 * Functions similar to `keyof E`, except producing the values instead of the keys.
 * @typeParam E - The type of the object
 * @remarks
 * This can be used to convert an `enum` interface produced by `typeof Enum` into the union type representing its members.
 */
export type ObjectValues<E extends object> = E[keyof E];

/**
 * Type helper that matches any `Function` type.
 * Equivalent to `Function`, but will not raise a warning from Biome.
 */
export type AnyFn = (...args: any[]) => any;

/**
 * Type helper to extract non-function properties from a type.
 *
 * @remarks
 * Useful to produce a type that is roughly the same as the type of `{... obj}`, where `obj` is an instance of `T`.
 * A couple of differences:
 * - Private and protected properties are not included.
 * - Nested properties are not recursively extracted. For this, use {@linkcode NonFunctionPropertiesRecursive}
 */
export type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends AnyFn ? never : K]: T[K];
};

/**
 * Type helper to extract out non-function properties from a type, recursively applying to nested properties.
 * This can be used to mimic the effects of JSON serialization and de-serialization on a given type.
 */
export type NonFunctionPropertiesRecursive<Class> = {
  [K in keyof Class as Class[K] extends AnyFn ? never : K]: Class[K] extends Array<infer U>
    ? NonFunctionPropertiesRecursive<U>[]
    : Class[K] extends object
      ? NonFunctionPropertiesRecursive<Class[K]>
      : Class[K];
};

/** Utility type for an abstract constructor. */
export type AbstractConstructor<T> = abstract new (...args: any[]) => T;

/**
 * Type helper that iterates through the fields of the type and coerces any `null` properties to `undefined` (including in union types).
 *
 * @remarks
 * This is primarily useful when an object with nullable properties wants to be serialized and have its `null`
 * properties coerced to `undefined`.
 */
export type CoerceNullPropertiesToUndefined<T extends object> = {
  [K in keyof T]: null extends T[K] ? Exclude<T[K], null> | undefined : T[K];
};

/**
 * Type helper to mark all properties in `T` as optional, while still mandating that at least 1
 * of its properties be present.
 *
 * Distinct from {@linkcode Partial} as this requires at least 1 property to _not_ be undefined.
 * @typeParam T - The object type to render partial
 */
export type AtLeastOne<T extends object> = Partial<T> & ObjectValues<{ [K in keyof T]: Pick<Required<T>, K> }>;

/**
 * Type helper that adds a brand to a type, used for nominal typing.
 *
 * @remarks
 * Brands should be either a string or unique symbol. This prevents overlap with other types.
 */
export declare class Brander<B extends string | symbol> {
  private __brand: B;
}

/**
 * Negate a number, converting its sign from positive to negative or vice versa.
 * @typeParam N - The number to negate
 * @privateRemarks
 * This should be used sparingly due to being slow for TypeScript to validate. \
 * Moreover, `tsc`'s limitations on "round-tripping" of numbers inside template literals
 * will cause this to fail for numbers not already in "simplest form"
 * (cf. https://github.com/microsoft/TypeScript/issues/57404).
 */
export type Negate<N extends number> =
  // Handle edge cases
  number extends N
    ? number
    : N extends 0
      ? 0
      : N extends PositiveInfinity
        ? NegativeInfinity
        : N extends NegativeInfinity
          ? PositiveInfinity
          : // Handle negative numbers
            `${N}` extends `-${infer P extends number}`
            ? P
            : // Handle positive numbers
              `-${N}` extends `${infer R extends number}`
              ? R
              : number;

/** Extract the required keys from an object that has optional ones */
export type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];

/** Pick from `T` the set of required properties  */
export type OnlyRequired<T> = Pick<T, RequiredKeys<T>>;

/**
 * Type helper to create a union of tuples in a given range.
 * @typeParam Min - The minimum length of the tuple (inclusive)
 * @typeParam Max - The maximum length of the tuple (inclusive)
 * @typeParam T - The type of the elements in the tuple
 */
export type TupleRange<Min extends number, Max extends number, T> =
  IntClosedRange<Min, Max> extends infer Lengths extends number ? TupleOf<Lengths, T> : never;
