import { getStatKey, type Stat } from "#enums/stat";
import type { EnumOrObject, NormalEnum, TSNumericEnum } from "#types/enum-types";
import type { ObjectValues } from "#types/type-helpers";
import { enumValueToKey } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import type { MatcherState } from "@vitest/expect";
import i18next from "i18next";

type Casing = "Preserve" | "Title";

interface getEnumStrOptions {
  /**
   * A string denoting the casing method to use.
   * @defaultValue "Preserve"
   */
  casing?: Casing;
  /**
   * If present, will be prepended to the beginning of the enum string.
   */
  prefix?: string;
  /**
   * If present, will be added to the end of the enum string.
   */
  suffix?: string;
}

/**
 * Return the name of an enum member or const object value, alongside its corresponding value.
 * @param obj - The {@linkcode EnumOrObject} to source reverse mappings from
 * @param enums - One of {@linkcode obj}'s values
 * @param casing - A string denoting the casing method to use; default `Preserve`
 * @param prefix - An optional string to be prepended to the enum's string representation
 * @param suffix - An optional string to be appended to the enum's string representation
 * @returns The stringified representation of `val` as dictated by the options.
 * @example
 * ```ts
 * enum testEnum {
 *   ONE = 1,
 *   TWO = 2,
 *   THREE = 3,
 * }
 * getEnumStr(fakeEnum, fakeEnum.ONE); // Output: "ONE (=1)"
 * getEnumStr(fakeEnum, fakeEnum.TWO, {casing: "Title", prefix: "fakeEnum.", suffix: "!!!"}); // Output: "fakeEnum.TWO!!! (=2)"
 * ```
 */
export function getEnumStr<E extends EnumOrObject>(
  obj: E,
  val: ObjectValues<E>,
  { casing = "Preserve", prefix = "", suffix = "" }: getEnumStrOptions = {},
): string {
  let casingFunc: ((s: string) => string) | undefined;
  switch (casing) {
    case "Preserve":
      break;
    case "Title":
      casingFunc = toTitleCase;
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
 * @returns The stringified representation of `enums`.
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
  /** An array of string names */
  let names: string[];

  if (obj[enums[0]] !== undefined) {
    // Reverse mapping exists - `obj` is a `TSNumericEnum` and its reverse mapped counterparts are strings
    names = enums.map(e => (obj as TSNumericEnum<E>)[e] as string);
  } else {
    // No reverse mapping exists means `obj` is a `NormalEnum`.
    // NB: This (while ugly) should be more ergonomic than doing a repeated lookup for large `const object`s
    // as the `enums` array should be significantly shorter than the corresponding enum type.
    names = [];
    for (const [k, v] of Object.entries(obj as NormalEnum<E>)) {
      if (names.length === enums.length) {
        // No more names to get
        break;
      }
      // Find all matches for the given enum, assigning their keys to the names array
      findIndices(enums, v).forEach(matchIndex => {
        names[matchIndex] = k;
      });
    }
  }
  return `[${names.join(", ")}] (=[${vals.join(", ")}])`;
}

/**
 * Return the indices of all occurrences of a value in an array.
 * @param arr - The array to search
 * @param searchElement - The value to locate in the array
 * @param fromIndex - The array index at which to begin the search. If fromIndex is omitted, the
 * search starts at index 0
 */
function findIndices<T>(arr: T[], searchElement: T, fromIndex = 0): number[] {
  const indices: number[] = [];
  const arrSliced = arr.slice(fromIndex);
  for (const [index, value] of arrSliced.entries()) {
    if (value === searchElement) {
      indices.push(index);
    }
  }
  return indices;
}

/**
 * Convert a number into an English ordinal
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

/**
 * Get the localized name of a {@linkcode Stat}.
 * @param s - The {@linkcode Stat} to check
 * @returns - The proper name for s, retrieved from the translations.
 */
export function getStatName(s: Stat): string {
  return i18next.t(getStatKey(s));
}

/**
 * Convert an object into a oneline diff to be shown in an error message.
 * @param obj - The object to return the oneline diff of
 * @returns The updated diff
 * @example
 * ```ts
 * const diff = getOnelineDiffStr.call(this, obj)
 * ```
 */
export function getOnelineDiffStr(this: MatcherState, obj: unknown): string {
  return this.utils
    .stringify(obj, undefined, { maxLength: 35, indent: 0, printBasicPrototype: false })
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/,(\s*)\}$/g, "$1}"); // Trim trailing commas
}
