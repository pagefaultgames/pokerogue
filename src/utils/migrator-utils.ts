import type { StringLiteral } from "#types/type-helpers";
/**
 * Determine whether the object is an array of non-null objects.
 */
export function validateIsArrayOfObjects(data: unknown): data is Record<string, unknown>[] {
  return Array.isArray(data) && data.every(item => typeof item === "object" && item !== null);
}

/**
 * Ensure `data.property` exists and is an object.
 * `data` must be a non-null object
 * If `summonData` does not exist on the object or is not a non-null object, it
 * will be initialized to an empty object.
 * @param data - The object to ensure has a `summonData` property; may be modified
 *   to add the property if it does not exist or is not an object.
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
 * Determine whether `data.property` exists and is an object.
 * `data` must be a non-null object
 * If `summonData` does not exist on the object or is not a non-null object, it
 * will be initialized to an empty object.
 * @param data - The object to ensure has a `summonData` property.
 * @param property - **String literal** of the property in question
 * @returns `true` if the property exists and is an object, `false` otherwise.
 *
 * @typeParam T - The string literal type of the property
 */
export function isPropertyAnObject<const T extends string>(
  data: Record<string, unknown>,
  property: StringLiteral<T>,
): data is Record<string, unknown> & Record<T, Record<string, unknown>> {
  return typeof data[property] === "object" && data[property] !== null;
}
