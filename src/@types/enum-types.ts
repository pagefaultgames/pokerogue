/** Union type accepting any TS Enum or `const object`, with or without reverse mapping. */
export type EnumOrObject = Record<string | number, string | number>;

/**
 * Utility type to extract the enum values from a `const object`,
 * or convert an `enum` object produced by `typeof Enum` into the union type representing its values.
 */
export type EnumValues<E> = E[keyof E];

/**
 * Generic type constraint representing a TS numeric enum with reverse mappings.
 * @example
 * TSNumericEnum<typeof WeatherType>
 */
// NB: this works because `EnumValues<typeof Enum>` returns the underlying Enum union type.
export type TSNumericEnum<T extends EnumOrObject> = number extends EnumValues<T> ? T : never;

/** Generic type constraint representing a non reverse-mapped TS enum or `const object`. */
export type NormalEnum<T extends EnumOrObject> = Exclude<T, TSNumericEnum<T>>;

// ### Type check tests

enum testEnumNum {
  testN1 = 1,
  testN2 = 2,
}

enum testEnumString {
  testS1 = "apple",
  testS2 = "banana",
}

const testObjNum = { testON1: 1, testON2: 2 } as const;

const testObjString = { testOS1: "apple", testOS2: "banana" } as const;

testEnumNum satisfies EnumOrObject;
testEnumString satisfies EnumOrObject;
testObjNum satisfies EnumOrObject;
testObjString satisfies EnumOrObject;

// @ts-expect-error - This is intentionally supposed to fail as an example
testEnumNum satisfies NormalEnum<typeof testEnumNum>;
testEnumString satisfies NormalEnum<typeof testEnumString>;
testObjNum satisfies NormalEnum<typeof testObjNum>;
testObjString satisfies NormalEnum<typeof testObjString>;

testEnumNum satisfies TSNumericEnum<typeof testEnumNum>;
// @ts-expect-error - This is intentionally supposed to fail as an example
testEnumString satisfies TSNumericEnum<typeof testEnumString>;
// @ts-expect-error - This is intentionally supposed to fail as an example
testObjNum satisfies TSNumericEnum<typeof testObjNum>;
// @ts-expect-error - This is intentionally supposed to fail as an example
testObjString satisfies TSNumericEnum<typeof testObjString>;
