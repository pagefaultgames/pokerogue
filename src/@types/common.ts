// TODO: T defaulting to `any` is type unsafe; this should realistically default to `never`
export type ConditionFn<T = any> = (args: T) => boolean;

export type { Constructor } from "type-fest";

// biome-ignore lint/style/useNamingConvention: this is a pseudo-primitive type
export type nil = null | undefined;

/**
 * A Map that is known to have values for every key that it can possibly have, and is thus guaranteed
 * to always return a proper value instead of `undefined`.
 * @remarks
 * Used for maps where we know the entire structure at compile time
 * (but may sometimes only technically be populated at runtime).
 * @example
 * ```ts
 * const myMap = new Map(["1", 2]) as DataMap<1, 2>;
 * ```
 */
export interface DataMap<K, V> extends Map<K, V> {
  get(key: K): V;
}
