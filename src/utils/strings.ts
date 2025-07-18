// TODO: Standardize file and path casing to remove the need for all these different casing methods
/**
 * Helper method to convert a string into `kebab-case` (such as one used for filenames).
 * @param str - The string being converted
 * @returns The result of converting `str` into kebab case.
 */
export function toKebabCase(str: string): string {
  return splitWords(str)
    .map(word => word.toLowerCase())
    .join("-");
}

/**
 * Split a string into an array of its constituent words
 * @param string - The string to be split.
 * @returns The new string, delimited at each instance of one or more spaces, underscores, or hyphens.
 */
function splitWords(str: string): string[] {
  return str.split(/[_ -]+/g);
}

/**
 * Helper method to convert a string into `snake_case` (such as one used for filenames).
 * @param str - The string being converted
 * @returns The result of converting `str` into snake case.
 */
export function toSnakeCase(str: string) {
  return splitWords(str)
    .map(word => word.toLowerCase())
    .join("_");
}

/**
 * Helper method to convert a string into `UPPER_SNAKE_CASE`.
 * @param str - The string being converted
 * @returns The result of converting `str` into upper snake case.
 */
export function toUpperSnakeCase(str: string) {
  return splitWords(str)
    .map(word => word.toUpperCase())
    .join("_");
}

/**
 * Helper method to convert a string into `Title Case` (such as one used for console logs).
 * @param str - The string being converted
 * @returns The result of converting `str` into title case.
 */
export function toTitleCase(str: string): string {
  return splitWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Capitalize the first letter of a string.
 * @param str - The string whose first letter is to be capitalized
 * @return The original string with its first letter capitalized.
 */
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toCamelCase(str: string) {
  return splitWords(str)
    .map((word, index) => (index === 0 ? word.toLowerCase() : capitalizeFirstLetter(word)))
    .join("");
}

export function toPascalCase(str: string) {
  return splitWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
