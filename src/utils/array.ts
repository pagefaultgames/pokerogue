/**
 * Split an array into a pair of arrays based on a conditional function.
 * @param array - The array to split into 2.
 * @param predicate - A function accepting up to 3 arguments. The split function calls the predicate function once per element of the array.
 * @param thisArg -  An object to which the `this` keyword can refer in the predicate function. If omitted, `undefined` is used as the `this` value.
 * @returns A pair of shallowly-copied arrays containing every element for which `predicate` did or did not return a value coercible to the boolean `true`.
 * @overload
 */
export function splitArray<T, S extends T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => value is S,
  thisArg?: unknown,
): [matches: S[], nonMatches: S[]];

/**
 * Split an array into a pair of arrays based on a conditional function.
 * @param array - The array to split into 2.
 * @param predicate - A function accepting up to 3 arguments. The split function calls the function once per element of the array.
 * @param thisArg -  An object to which the `this` keyword can refer in the predicate function. If omitted, `undefined` is used as the `this` value.
 * @returns A pair of shallowly-copied arrays containing every element for which `predicate` did or did not return a value coercible to the boolean `true`.
 * @overload
 */
export function splitArray<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => unknown,
  thisArg?: unknown,
): [matches: T[], nonMatches: T[]];
/**
 * Split an array into a pair of arrays based on a conditional function.
 * @param array - The array to split into 2.
 * @param predicate - A function accepting up to 3 arguments. The split function calls the function once per element of the array.
 * @param thisArg -  An object to which the `this` keyword can refer in the predicate function. If omitted, `undefined` is used as the `this` value.
 * @returns A pair of shallowly-copied arrays containing every element for which `predicate` did or did not return a value coercible to the boolean `true`.
 * @overload
 */
export function splitArray<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => unknown,
  thisArg?: unknown,
): [matches: T[], nonMatches: T[]] {
  const matches: T[] = [];
  const nonMatches: T[] = [];

  const p = predicate.bind(thisArg) as typeof predicate;
  array.forEach((val, index, ar) => {
    if (p(val, index, ar)) {
      matches.push(val);
    } else {
      nonMatches.push(val);
    }
  });
  return [matches, nonMatches];
}
