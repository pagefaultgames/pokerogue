/** Union type accepting any TS Enum or `const object`, with or without reverse mapping. */
export type EnumOrObject = Record<string | number, string | number>;

/**
 * Utility type to extract the enum values from a `const object`,
 * or convert an `enum` interface produced by `typeof Enum` into the union type representing its values.
 */
export type EnumValues<E> = E[keyof E];

/**
 * Generic type constraint representing a TS numeric enum with reverse mappings.
 * @example
 * TSNumericEnum<typeof WeatherType>
 */
export type TSNumericEnum<T extends EnumOrObject> = number extends EnumValues<T> ? T : never;

/** Generic type constraint representing a non reverse-mapped TS enum or `const object`. */
export type NormalEnum<T extends EnumOrObject> = Exclude<T, TSNumericEnum<T>>;
