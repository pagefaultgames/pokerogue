export type ConditionFn = (args?: any[]) => boolean;

/** A union type of all primitives (types that are always passed by value) */
export type Primitive = string | number | boolean | bigint | null | undefined | symbol;

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: unknown[]) => T;

export type nil = null | undefined;
