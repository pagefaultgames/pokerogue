// TODO: T defaulting to `any` is type unsafe; this should realistically default to `never`
export type ConditionFn<T = any> = (args: T) => boolean;

export type { Constructor } from "type-fest";

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
