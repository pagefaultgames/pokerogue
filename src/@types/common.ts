export type ConditionFn = (args?: any[]) => boolean;

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: unknown[]) => T;

export type nil = null | undefined;
