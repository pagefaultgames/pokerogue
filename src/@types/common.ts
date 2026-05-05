// TODO: T defaulting to `any` is type unsafe; this should realistically default to `never`
export type ConditionFn<T = any> = (args: T) => boolean;

export type { Constructor } from "type-fest";

// biome-ignore lint/style/useNamingConvention: this is a pseudo-primitive type
export type nil = null | undefined;

/**
 * A Map that is known to have keys for every key that it can possibly have, and is thus guaranteed
 * to always return a proper value instead of `undefined`.
 * @remarks
 * Used for maps where we know the entire structure at compile time
 * (but may sometimes only technically be populated at runtime).
 */
// TODO: Move this to another file
export interface DataMap<K, V> extends Map<K, V> {
  get(key: K): V;
}

/**
 * Type helper to check if a given item is in a tuple, returning `true` or `false` as appropriate.
 * @typeParam T - The tuple to check
 * @param X - The item whose inclusion is being checked
 */
type InArray<T, X> = T extends readonly [X, ...infer _Rest]
  ? true
  : T extends readonly [X]
    ? true
    : T extends readonly [infer _, ...infer Rest]
      ? InArray<Rest, X>
      : false;

/**
 * Type helper to allow only unique elements in a tuple (effectively converting it to a Set).
 * Within it, any duplicate elements will be flagged and converted to an error message.
 * @typeParam T - The tuple to render unique
 */
export type UniqueArray<T> = T extends readonly [infer X, ...infer Rest]
  ? InArray<Rest, X> extends true
    ? ["Encountered value with duplicates:", X]
    : readonly [X, ...UniqueArray<Rest>]
  : T;
