export type ConditionFn = (args?: any[]) => boolean;

/** A union type of all primitives (types that are always passed by value) */
export type Primitive = string | number | boolean | bigint | null | undefined | symbol;

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: unknown[]) => T;

export type nil = null | undefined;

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
