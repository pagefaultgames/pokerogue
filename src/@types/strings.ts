/**
 * A type that can be converted into a string by TypeScript.
 */
export type Stringable = string | number | bigint | boolean | null | undefined;

/** Convert a type to string form. */
export type Stringify<S extends Stringable> = `${S}`;
