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

 * If a property in `src` does not exist in `dest` or its `typeof` evaluates differently, it is skipped.
 * If it is a non-array object, its properties are recursed into and checked in turn.
 * All other values are copied verbatim.
 * @param dest The object to merge values into
 * @param source The object to source merged values from
 * @remarks Do not use for regular objects; this is specifically made for JSON copying.
 * @see deepMergeObjects
 */
export function deepMergeSpriteData(dest: object, source: object) {
  // Grab all the keys present in both with similar types
  const matchingKeys = Object.keys(source).filter(key => {
    const destVal = dest[key];
    const sourceVal = source[key];

    return (
      // 1st part somewhat redundant, but makes it clear that we're explicitly interested in properties that exist in both
      key in source && Array.isArray(sourceVal) === Array.isArray(destVal) && typeof sourceVal === typeof destVal
    );
  });

  for (const key of matchingKeys) {
    // Pure objects get recursed into; everything else gets overwritten
    if (typeof source[key] !== "object" || source[key] === null || Array.isArray(source[key])) {
      dest[key] = source[key];
    } else {
      deepMergeSpriteData(dest[key], source[key]);
    }
  }
}
