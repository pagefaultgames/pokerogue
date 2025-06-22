// biome-ignore lint/correctness/noUnusedImports: Used for a JSDoc comment
import type { EnumOrObject, EnumValues, TSNumericEnum, NormalEnum } from "#app/@types/enum-types";

/**
 * Return the string keys of an Enum object, excluding reverse-mapped numbers.
 * @param enumType - The numeric enum to retrieve keys for.
 * @returns An ordered array of all of `enumType`'s string keys.
 * @remarks
 * To retrieve the keys of a {@linkcode NormalEnum}, use {@linkcode Object.keys} instead.
 */
export function getEnumKeys<E extends EnumOrObject>(enumType: TSNumericEnum<E>): (keyof E)[] {
  // All enum values are either normal or reverse mapped, so we can retrieve the keys by filtering out all strings.
  return Object.values(enumType).filter(v => typeof v === "string");
}

/**
 * Return the numeric values of a numeric Enum object, excluding reverse-mapped strings.
 * @param enumType - The enum object to retrieve keys for.
 * @returns An ordered array of all of `enumType`'s number values.
 * @remarks
 * To retrieve the keys of a {@linkcode NormalEnum}, use {@linkcode Object.values} instead.
 */
// NB: This does not use `EnumValues<E>` due to variable highlighting in IDEs.
export function getEnumValues<E extends EnumOrObject>(enumType: TSNumericEnum<E>): E[keyof E][] {
  return Object.values(enumType).filter(v => typeof v !== "string") as E[keyof E][];
}

/**
 * Return the name of the key that matches the given Enum value.
 * Can be used to emulate Typescript reverse mapping for `const object`s or string enums.
 * @param object - The {@linkcode EnumOrObject} to check
 * @param val - The value to get the key of.
 * @returns The name of the key with the specified value.
 * @example
 * const thing = {
 *   one: 1,
 *   two: 2,
 * } as const;
 * console.log(enumValueToKey(thing, thing.two)); // output: "two"
 * @throws Error if an invalid enum value is passed to the function
 * @remarks
 * If multiple keys map to the same value, the first one (in insertion order) will be retrieved.
 */
export function enumValueToKey<T extends EnumOrObject>(object: T, val: T[keyof T]): keyof T {
  for (const [key, value] of Object.entries(object)) {
    if (val === value) {
      return key as keyof T;
    }
  }
  throw new Error(`Invalid value passed to \`enumValueToKey\`! Value: ${val}`);
}
