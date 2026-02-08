import type { IsAny, IsEqual, IsNever, IsUnknown, Primitive, UnionToTuple } from "type-fest";

/**
 * An invalid type with a custom error message. \
 * Exists solely to display IDE errors in a non-distributive way, and is functionally useless for practical purposes.
 */
export type ErrorType<Msg extends string> = Error & Msg;

export type IncompatibleTypeMessage<Expected, Received> =
  `Expected to receive ${FormatType<Expected>}, but got ${FormatType<Received>} instead!`;

// TODO: Use version from "#types/strings" once said file is added in random species PR
type Stringable = string | number | bigint | boolean | null | undefined;

/**
 * Internal type helper to convert 2 arbitrary types (or unions thereof) into human-readable strings
 * suitable for use in error messages and the like.
 * @internal
 */
export type FormatType<T> =
  // special cases to avoid splitting up into `'true' | 'false'` and `'string' | 'number'` | ...
  IsEqual<Primitive, T> extends true
    ? "a primitive"
    : IsEqual<boolean, T> extends true
      ? "a boolean"
      : // Add "a" prefix for single types
        UnionToTuple<T> extends [infer Only]
        ? AddPrefix<PrintTypeInternal<Only>>
        : // List multi-member unions as a list of members separated by quotes and pipes,
          // handling boolean separately to avoid splitting it up as mentioned above
          Extract<T, boolean> extends never
          ? `'${StringifyTuple<UnionToTuple<T>, "' | '">}'`
          : `'${StringifyTuple<[...UnionToTuple<Exclude<T, boolean>>, boolean], "' | '">}'`;

/**
 * Tail-recursive helper to stringify a tuple with an arbitrary delimiter.
 */
type StringifyTuple<Arr extends unknown[], Delim extends string, Acc extends string = ""> = Arr extends []
  ? Acc
  : Arr extends [infer First, ...infer Rest]
    ? StringifyTuple<
        Rest,
        Delim,
        Acc extends "" ? PrintTypeInternal<First> : `${Acc}${Delim}${PrintTypeInternal<First>}`
      >
    : never;

type AddPrefix<Str extends string> = `${Str extends `${"a" | "e" | "i" | "o" | "u"}${infer _}` ? "an" : "a"} ${Str}`;

/**
 * Internal type helper to convert a stringable value into a more descriptive string.
 * @internal
 */
type PrintTypeInternal<T> =
  IsUnknown<T> extends true
    ? "unknown"
    : IsNever<T> extends true
      ? "never"
      : IsAny<T> extends true
        ? never
        : // special case boolean
          boolean extends T
          ? "boolean"
          : T extends (...args: never) => unknown
            ? "function"
            : T extends object
              ? "object"
              : T extends symbol
                ? "symbol"
                : string extends T
                  ? "string"
                  : number extends T
                    ? "number"
                    : bigint extends T
                      ? "bigint"
                      : boolean extends T
                        ? "boolean"
                        : T extends Stringable
                          ? `${T}`
                          : never;
