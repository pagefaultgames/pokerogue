/**
 * Perform a deep copy of an object.
 * @param values - The object to be deep copied.
 * @returns A new object that is a deep copy of the input.
 */
export function deepCopy(values: object): object {
  // Convert the object to a JSON string and parse it back to an object to perform a deep copy
  return JSON.parse(JSON.stringify(values));
}

/**
 * Deeply merge two JSON objects' common properties together.
 * This copies all values from `source` that match properties inside `dest`,
 * checking recursively for non-null nested objects.

 * If a property in `source` does not exist in `dest` or its `typeof` evaluates differently, it is skipped.
 * If it is a non-array object, its properties are recursed into and checked in turn.
 * All other values are copied verbatim.
 * @param dest - The object to merge values into
 * @param source - The object to source merged values from
 * @remarks Do not use for regular objects; this is specifically made for JSON copying.
 */
export function deepMergeSpriteData(dest: object, source: object) {
  for (const key of Object.keys(source)) {
    if (
      !(key in dest) ||
      typeof source[key] !== typeof dest[key] ||
      Array.isArray(source[key]) !== Array.isArray(dest[key])
    ) {
      continue;
    }

    // Pure objects get recursed into; everything else gets overwritten
    if (typeof source[key] !== "object" || source[key] === null || Array.isArray(source[key])) {
      dest[key] = source[key];
    } else {
      deepMergeSpriteData(dest[key], source[key]);
    }
  }
}
