export type ConditionFn<T = any> = (args: T) => boolean;

/** A union type of all primitives (types that are always passed by value) */
export type Primitive = string | number | boolean | bigint | null | undefined | symbol;

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: any[]) => T;

export type nil = null | undefined;
