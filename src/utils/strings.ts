// TODO: Standardize file and path casing to remove the need for all these different casing methods

// #region Split string code

// Regexps involved with splitting words in various case formats.
// Sourced from https://www.npmjs.com/package/change-case (with slight tweaking here and there)

/** Regex to split at word boundaries.*/
const SPLIT_LOWER_UPPER_RE = /([\p{Ll}\d])(\p{Lu})/gu;
/** Regex to split around single-letter uppercase words.*/
const SPLIT_UPPER_UPPER_RE = /(\p{Lu})([\p{Lu}][\p{Ll}])/gu;
/** Regexp involved with stripping non-word delimiters from the result. */
const DELIM_STRIP_REGEXP = /[-_ ]+/giu;
// The replacement value for splits.
const SPLIT_REPLACE_VALUE = "$1\0$2";

/**
 * Split any cased string into an array of its constituent words.
 * @param string - The string to be split
 * @returns The new string, delimited at each instance of one or more spaces, underscores, hyphens
 * or lower-to-upper boundaries.
 * @remarks
 * **DO NOT USE THIS FUNCTION!**
 * Exported only to allow for testing.
 * @todo Consider tests into [in-source testing](https://vitest.dev/guide/in-source.html) and converting this to unexported
 */
export function splitWords(value: string): string[] {
  let result = value.trim();
  result = result.replace(SPLIT_LOWER_UPPER_RE, SPLIT_REPLACE_VALUE).replace(SPLIT_UPPER_UPPER_RE, SPLIT_REPLACE_VALUE);
  result = result.replace(DELIM_STRIP_REGEXP, "\0");

  // Trim the delimiter from around the output string
  return trimFromStartAndEnd(result, "\0").split(/\0/g);
}

/**
 * Helper function to remove one or more sequences of characters from either end of a string.
 * @param str - The string to replace
 * @param charToTrim - The string to remove
 * @returns The result of removing all instances of {@linkcode charsToTrim} from either end of {@linkcode str}.
 */
function trimFromStartAndEnd(str: string, charToTrim: string): string {
  let start = 0;
  let end = str.length;
  const blockLength = charToTrim.length;

  while (str.startsWith(charToTrim, start)) {
    start += blockLength;
  }
  if (start - end === blockLength) {
    // Occurs if the ENTIRE string is made up of charToTrim (at which point we return nothing)
    return "";
  }
  while (str.endsWith(charToTrim, end)) {
    end -= blockLength;
  }
  return str.slice(start, end);
}

// #endregion Split String code

/**
 * Capitalize the first letter of a string.
 * @param str - The string whose first letter is to be capitalized
 * @return The original string with its first letter capitalized.
 * @example
 * ```ts
 * console.log(capitalizeFirstLetter("consectetur adipiscing elit")); // returns "Consectetur adipiscing elit"
 * ```
 */
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
 * Helper method to convert a string into `camelCase` (such as one used for i18n keys).
 * @param str - The string being converted
 * @returns The result of converting `str` into camel case.
 * @example
 * ```ts
 * console.log(toCamelCase("BIG_ANGRY_TRAINER")); // returns "bigAngryTrainer"
 * ```
 */
export function toCamelCase(str: string) {
  return splitWords(str)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");
}

/**
 * Helper method to convert a string into `PascalCase`.
 * @param str - The string being converted
 * @returns The result of converting `str` into pascal case.
 * @example
 * ```ts
 * console.log(toPascalCase("hi how was your day")); // returns "HiHowWasYourDay"
 * ```
 * @remarks
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
 * console.log(toKebabCase("not_kebab-caSe String")); // returns "not-kebab-case-string"
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
