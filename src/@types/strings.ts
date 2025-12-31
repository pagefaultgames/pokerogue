import type { Tagged } from "type-fest";
import type { IsLiteral } from "./type-helpers";

/**
 * A type that can be converted into a string by TypeScript.
 */
export type Stringable = string | number | bigint | boolean | null | undefined;

/** Dummy constant for use inside tagged types. */
declare const stringTag: unique symbol;

/**
 * Convert a type to string form.
 * @typeParam S - The type to convert into a string
 */
// NB: Extends used to make type distribute over unions, ensuring `string | number` turns into `string`
export type Stringify<S> = S extends Stringable
  ? IsLiteral<S> extends true
    ? Tagged<`${S}`, typeof stringTag, S>
    : `${S}`
  : never;

/**
 * Convert a stringified type to its un-stringified counterpart.
 * Non-string portions of a type are left as is.
 * @typeParam S - The type to unwrap
 */
export type Unstringify<S> =
  S extends Tagged<unknown, typeof stringTag, infer O extends Stringable>
    ? O
    : S extends `${infer U extends Exclude<Stringable, string>}`
      ? U
      : S;
