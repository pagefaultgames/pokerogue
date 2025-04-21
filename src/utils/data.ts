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
      // Somewhat redundant, but makes it clear that we're explicitly interested in properties that exist in both
      key in source && Array.isArray(sourceVal) === Array.isArray(destVal) && typeof sourceVal === typeof destVal
    );
  });

  for (const key of matchingKeys) {
    if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
      deepMergeSpriteData(dest[key], source[key]);
    } else {
      dest[key] = source[key];
    }
  }
}
