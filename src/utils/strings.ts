// TODO: Standardize file and path casing to remove the need for all these different casing methods
/**
 * Helper method to convert a string into `kebab-case` (such as one used for filenames).
 * @param str - The string being converted
 * @returns The result of converting `str` into kebab case.
 * @example
 * ```ts
 * console.log(toKebabCase("not_kebab-caSe-String")); // returns "non-kebab-case-string"
 * ```
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
 * @example
 * ```ts
 * console.log(toSnakeCase("not-a_snake CaSe")); // returns "not_a_snake_case"
 * ```
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
 * @example
 * ```ts
 * console.log(toUpperSnakeCase("apples-bananas_oranGes Pears")); // returns "APPLES_BANANAS_ORANGES_PEARS"
 * ```
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
 * @example
 * ```ts
 * console.log(toTitleCase("lorem ipsum dolor sit amet")); // returns "Lorem Ipsum Dolor Sit Amet"
 * ```
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
 * @example
 * ```ts
 * console.log(capitalizeFirstLetter("simple man")); // returns "Simple man"
 * ```
 */
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper method to convert a string into `camelCase` (such as one used for i18n keys).
 * @param str - The string being converted
 * @returns The result of converting `str` into camel case.
 * @example
 * ```ts
 * console.log(toTitleCase("BIG_ANGRY_TRAINER")); // returns "bigAngryTrainer"
 * ```
 */
export function toCamelCase(str: string) {
  return splitWords(str)
    .map((word, index) => (index === 0 ? word.toLowerCase() : capitalizeFirstLetter(word)))
    .join("");
}

/**
 * Helper method to convert a string into `PascalCase`.
 * @param str - The string being converted
 * @returns The result of converting `str` into pascal case.
 * @example
 * ```ts
 * console.log(toTitleCase("hi how was your day")); // returns "HiHowWasYourDay"
 * ```
 */
export function toPascalCase(str: string) {
  return splitWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Helper method to convert a string into `kebab-case` (such as one used for filenames).
 * @param str - The string being converted
 * @returns The result of converting `str` into kebab case.
 * @example
 * ```ts
 * console.log(toKebabCase("not_kebab-caSe String")); // returns "non-kebab-case-string"
 * ```
 */
export function toKebabCase(str: string): string {
  return splitWords(str)
    .map(word => word.toLowerCase())
    .join("-");
}

/**
 * Helper method to convert a string into `snake_case` (such as one used for filenames).
 * @param str - The string being converted
 * @returns The result of converting `str` into snake case.
 * @example
 * ```ts
 * console.log(toSnakeCase("not-in snake_CaSe")); // returns "not_in_snake_case"
 * ```
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
 * @example
 * ```ts
 * console.log(toUpperSnakeCase("apples bananas_oranGes-PearS")); // returns "APPLES_BANANAS_ORANGES_PEARS"
 * ```
 */
export function toUpperSnakeCase(str: string) {
  return splitWords(str)
    .map(word => word.toUpperCase())
    .join("_");
}

/**
 * Helper method to convert a string into `Pascal_Snake_Case`.
 * @param str - The string being converted
 * @returns The result of converting `str` into pascal snake case.
 * @example
 * ```ts
 * console.log(toPascalSnakeCase("apples-bananas_oranGes Pears")); // returns "Apples_Bananas_Oranges_Pears"
 * ```
 */
export function toPascalSnakeCase(str: string) {
  return splitWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("_");
}
