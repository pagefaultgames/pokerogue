import type { ObjectValues } from "#types/type-helpers";

/** Union type accepting any TS Enum or `const object`, with or without reverse mapping. */
export type EnumOrObject = Record<string | number, string | number>;

/**
 * Generic type constraint representing a TS numeric enum with reverse mappings.
 * @example
 * TSNumericEnum<typeof WeatherType>
 */
export type TSNumericEnum<T extends EnumOrObject> = number extends ObjectValues<T> ? T : never;

/** Generic type constraint representing a non reverse-mapped TS enum or `const object`. */
export type NormalEnum<T extends EnumOrObject> = Exclude<T, TSNumericEnum<T>>;
