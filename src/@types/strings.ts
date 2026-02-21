import type { PreventHoverExpansion } from "./type-helpers";

/**
 * A type that can be converted into a string by TypeScript.
 */
export type Stringable = string | number | bigint | boolean | null | undefined;

/**
 * Convert a type to string form.
 * @typeParam S - The type to convert into a string
 */
export type Stringify<S extends Stringable> = PreventHoverExpansion<
  // NB: We cannot tag the produced string literal to preserve enum types, as TS does not allow indexing objects with tagged types
  // (which would break uses of `Object.keys`/etc).
  // Since we are actively removing TypeScript enums from the codebase anyways, this is fairly benign.
  S extends unknown ? `${S}` : never
>;

/**
 * Convert a stringified type to its un-stringified counterpart.
 * Non-string portions of a type are left as is.
 * @typeParam S - The type to unwrap
 */
export type Unstringify<S> =
  S extends Stringify<infer O extends Exclude<Stringable, string>>
    ? O
    : S extends `${infer U extends Exclude<Stringable, string>}`
      ? U
      : S;
