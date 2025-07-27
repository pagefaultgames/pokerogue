import type { EnumOrObject, EnumValues, NormalEnum, TSNumericEnum } from "#types/enum-types";
import { toReadableString } from "#utils/common";
import { enumValueToKey } from "#utils/enums";

type Casing = "Preserve" | "Title";

interface getEnumStrOptions {
  /**
   * A string denoting the casing method to use.
   * @defaultValue "Preserve"
   */
  casing?: Casing;
  /**
   * If present, will be added to the beginning of the enum string.
   */
  prefix?: string;
  /**
   * If present, will be added to the end of the enum string.
   */
  suffix?: string;
}

/**
 * Helper function to return the name of an enum member or const object value, alongside its corresponding value.
 * @param obj - The {@linkcode EnumOrObject} to source reverse mappings from
 * @param enums - One of {@linkcode obj}'s values
 * @param casing - A string denoting the casing method to use; default `Preserve`
 * @param suffix - An optional string to be prepended to the enum's string representation.
 * @param suffix - An optional string to be appended to the enum's string representation.
 * @returns The stringified representation of `val` as dictated by the options.
 * @example
 * ```ts
 * enum fakeEnum {
 *   ONE: 1,
 *   TWO: 2,
 *   THREE: 3,
 * }
 * console.log(getEnumStr(fakeEnum, fakeEnum.ONE)); // Output: "ONE (=1)"
 * console.log(getEnumStr(fakeEnum, fakeEnum.TWO, {case: "Title", suffix: " Terrain"})); // Output: "Two Terrain (=2)"
 * ```

 */
export function getEnumStr<E extends EnumOrObject>(
  obj: E,
  val: EnumValues<E>,
  { casing = "Preserve", prefix = "", suffix = "" }: getEnumStrOptions = {},
): string {
  let casingFunc: ((s: string) => string) | undefined;
  switch (casing) {
    case "Preserve":
      break;
    case "Title":
      casingFunc = toReadableString;
      break;
  }

  let stringPart =
    obj[val] !== undefined
      ? // TS reverse mapped enum
        (obj[val] as string)
      : // Normal enum/`const object`
        (enumValueToKey(obj as NormalEnum<E>, val) as string);

  if (casingFunc) {
    stringPart = casingFunc(stringPart);
  }

  return `${prefix}${stringPart}${suffix} (=${val})`;
}

/**
 * Convert an array of enums or `const object`s into a readable string version.
 * @param obj - The {@linkcode EnumOrObject} to source reverse mappings from
 * @param enums - An array of {@linkcode obj}'s values
 * @returns The stringified representation of `enums`
 * @example
 * ```ts
 * enum fakeEnum {
 *   ONE: 1,
 *   TWO: 2,
 *   THREE: 3,
 * }
 * console.log(stringifyEnumArray(fakeEnum, [fakeEnum.ONE, fakeEnum.TWO, fakeEnum.THREE])); // Output: "[ONE, TWO, THREE] (=[1, 2, 3])"
 * ```
 */
export function stringifyEnumArray<E extends EnumOrObject>(obj: E, enums: E[keyof E][]): string {
  if (obj.length === 0) {
    return "[]";
  }

  const vals = enums.slice();
  let names: string[];

  if (obj[enums[0]] !== undefined) {
    // Reverse mapping exists - `obj` is a `TSNumericEnum` and its reverse mapped counterparts
    names = enums.map(e => (obj as TSNumericEnum<E>)[e] as string);
  } else {
    // No reverse mapping exists means `obj` is a `NormalEnum`
    names = enums.map(e => enumValueToKey(obj as NormalEnum<E>, e) as string);
  }

  return `[${names.join(", ")}] (=[${vals.join(", ")}])`;
}

/**
 * Convert a number into an English ordinal.
 * @param num - The number to convert into an ordinal
 * @returns The ordinal representation of {@linkcode num}.
 * @example
 * ```ts
 * console.log(getOrdinal(1)); // Output: "1st"
 * console.log(getOrdinal(12)); // Output: "12th"
 * console.log(getOrdinal(24)); // Output: "24th"
 * ```
 */
export function getOrdinal(num: number): string {
  const tens = num % 10;
  const hundreds = num % 100;
  if (tens === 1 && hundreds !== 11) {
    return num + "st";
  }
  if (tens === 2 && hundreds !== 12) {
    return num + "nd";
  }
  if (tens === 3 && hundreds !== 13) {
    return num + "rd";
  }
  return num + "th";
}
