/**
 * Dig into an object using a list of keys.
 *
 * @param {Object} object The object to dig into
 * @param {string[]} keys The keys to use
 * @returns {any} The value found
 */
export function dig(object: Object, keys: string[]): any {
  return keys.reduce((acc, key) => acc[key], object);
}


/**
 * Update a nested object with a new value.
 *
 * @param {Object} object The object to update
 * @param {string[]} path The path to the value
 * @param {any} value The new value
 */
export function updateNestedObject(object: Object, path: string[], value: any): void{
  if (!path || path.length === 0) {
    throw new Error("Path must be provided");
  }

  // Start from the root object
  let current = object;

  // Iterate over the path array, except for the last key
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    // Ensure the key exists and it's an object to navigate into
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }

    // Move to the next level in the object hierarchy
    current = current[key];
  }

  // Update the final key with the new value
  const lastKey = path[path.length - 1];
  current[lastKey] = value;
}

/**
 * Serialize an object into a string with backticks for multiline strings.
 *
 * @param {any} object The object to serialize
 * @returns {string} The serialized object
 */
export function serializeWithBackticks(object: any): string {
  if (typeof object === "object" && object !== null) {
    const entries = Object.entries(object).map(([key, value]) => {
      return `"${key}": ${serializeWithBackticks(value)}`;
    });
    return `{ ${entries.join(", ")} }`;
  } else if (typeof object === "string") {
    if (!object.includes("\n")) {
      return `"${object.replace(/\"/g, "\\\"")}"`;
    }
    const parsedObj = object.replace(/\n([^\s])/g, (match) => `\\n${match[1]}`).replace(/\`/g, "\\`");
    return  `\`${parsedObj}\``;
  } else {
    return String(object);
  }
}
