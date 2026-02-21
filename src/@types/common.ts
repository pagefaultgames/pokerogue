export type ConditionFn<T = any> = (args: T) => boolean;

/** A union type of all primitives (types that are always passed by value) */
export type Primitive = string | number | boolean | bigint | null | undefined | symbol;

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: any[]) => T;

// biome-ignore lint/style/useNamingConvention: this is a pseudo-primitive type
export type nil = null | undefined;

/**
 * This removes the `| undefined` from `Map#get`'s return type.
 * @remarks
 * Used for maps where we know the entire structure at compile time
 * (but may sometimes only technically be populated at runtime).
 */
export interface DataMap<K, V> extends Map<K, V> {
  get(key: K): V;
}
