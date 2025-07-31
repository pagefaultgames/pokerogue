import type { EnumOrObject, NormalEnum, TSNumericEnum } from "#types/enum-types";
import type { InferKeys, ObjectValues } from "#types/type-helpers";

/**
 * Return the string keys of an Enum object, excluding reverse-mapped numbers.
 * @param enumType - The numeric enum to retrieve keys for
 * @returns An ordered array of all of `enumType`'s string keys
 * @example
 * enum fruit {
 *   apple = 1,
 *   banana = 2,
 *   cherry = 3,
 *   orange = 12,
 * };
 *
 * console.log(getEnumKeys<typeof fruit>(fruit)); // output: ["apple", "banana", "cherry", "orange"]
 * @remarks
 * To retrieve the keys of a {@linkcode NormalEnum}, use {@linkcode Object.keys} instead.
 */
export function getEnumKeys<E extends EnumOrObject>(enumType: TSNumericEnum<E>): (keyof E)[] {
  // All enum values are either normal numbers or reverse mapped strings, so we can retrieve the keys by filtering out numbers.
  return Object.values(enumType).filter(v => typeof v === "string");
}

/**
 * Return the numeric values of a numeric Enum object, excluding reverse-mapped strings.
 * @param enumType - The enum object to retrieve keys for
 * @returns An ordered array of all of `enumType`'s number values
 * @example
 * enum fruit {
 *   apple = 1,
 *   banana = 2,
 *   cherry = 3,
 *   orange = 12,
 * };
 *
 * console.log(getEnumValues<typeof fruit>(fruit)); // output: [1, 2, 3, 12]
 *
 * @remarks
 * To retrieve the keys of a {@linkcode NormalEnum}, use {@linkcode Object.values} instead.
 */
// NB: This intentionally does not use `EnumValues<E>` as using `E[keyof E]` leads to improved variable highlighting in IDEs.
export function getEnumValues<E extends EnumOrObject>(enumType: TSNumericEnum<E>): E[keyof E][] {
  return Object.values(enumType).filter(v => typeof v !== "string") as E[keyof E][];
}

/**
 * Return the name of the key that matches the given Enum value.
 * Can be used to emulate Typescript reverse mapping for `const object`s or string enums.
 * @param object - The {@linkcode NormalEnum} to check
 * @param val - The value to get the key of
 * @returns The name of the key with the specified value
 * @example
 * const thing = {
 *   one: 1,
 *   two: 2,
 * } as const;
 * console.log(enumValueToKey(thing, 2)); // output: "two"
 * @throws Error if an invalid enum value is passed to the function
 * @remarks
 * If multiple keys map to the same value, the first one (in insertion order) will be retrieved,
 * but the return type will be the union of ALL their corresponding keys.
 */
export function enumValueToKey<T extends EnumOrObject, V extends ObjectValues<T>>(
  object: NormalEnum<T>,
  val: V,
): InferKeys<T, V> {
  for (const [key, value] of Object.entries(object)) {
    if (val === value) {
      return key as InferKeys<T, V>;
    }
  }
  throw new Error(`Invalid value passed to \`enumValueToKey\`! Value: ${val}`);
}
