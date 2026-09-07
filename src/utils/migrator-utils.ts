import type { StringLiteral } from "#types/type-helpers";

/**
 * Determine whether the object is an array of non-null objects.
 */
export function validateIsArrayOfObjects(data: unknown): data is Record<string, unknown>[] {
  return Array.isArray(data) && data.every(item => typeof item === "object" && item !== null);
}

/**
 * Ensure `data.property` exists and is a non-null object.
 *
 * If `property` does not exist on the object or is not a non-null object, it
 * will be initialized to an empty object.
 *
 * @param data - The object to ensure has a specific property. Must be a non-null object.
 * @param property - **String literal** of the property in question
 *
 * @typeParam T - The string literal type of the property
 */
export function ensurePropertyIsObject<const T extends string>(
  data: Record<string, unknown>,
  property: StringLiteral<T>,
): asserts data is Record<string, unknown> & Record<T, Record<string, unknown>> {
  if (typeof data[property] !== "object" || data[property] == null) {
    data[property] = {};
  }
}

/**
 * Determine whether `data.property` exists and is a non-null an object.
 *
 * @param data - The object to ensure has a specific property. Must be a non-null object.
 * @param property - **String literal** of the property in question
 *
 * @returns Whether the property exists and is a non-null object
 *
 * @typeParam T - The string literal type of the property
 */
export function isPropertyAnObject<const T extends string>(
  data: Record<string, unknown>,
  property: StringLiteral<T>,
): data is Record<string, unknown> & Record<T, Record<string, unknown>> {
  return typeof data[property] === "object" && data[property] !== null;
}

/**
 * Converts a version string into an array of numbers for use in the comparison function.
 * @param versionString - The version to convert
 * @returns An array of numbers corresponding to the input version
 * @throws An error if the version string is not valid (of the form "#.#.#[.#]")
 * @example
 * ```ts
 * extractVersion("1.2.3"); // output: [1, 2, 3, 0]
 * extractVersion("1.2.3.4"); // output: [1, 2, 3, 4]
 * extractVersion("1..2.3"); // throws error
 * extractVersion("1.2.3.4.5"); // throws error
 * ```
 */
function extractVersion(versionString: string): number[] {
  // https://regex101.com/r/7r1299/1
  const regex = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
  if (!regex.test(versionString)) {
    throw new Error(`Invalid version string (${versionString}) in version migrator!`);
  }

  const versionArray = versionString.split(".").map(v => Number.parseInt(v));
  if (versionArray.length === 3) {
    versionArray.push(0);
  }
  return versionArray;
}

/**
 * Compares two versions and returns whether one is newer than the other.
 * @param versionA - The first version to compare
 * @param versionB - The second version to compare
 * @returns The result of the comparison:
 * - `1`: `versionA` is newer
 * - `-1`: `versionB` is newer
 * - `0`: The versions are equal
 */
export function compareVersions(versionA: string, versionB: string): -1 | 0 | 1 {
  const a = extractVersion(versionA);
  const b = extractVersion(versionB);

  for (let i = 0; i < 4; i++) {
    if (a[i] > b[i]) {
      return 1;
    }
    if (a[i] < b[i]) {
      return -1;
    }
  }

  return 0;
}
