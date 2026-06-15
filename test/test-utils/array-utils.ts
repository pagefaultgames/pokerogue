/**
 * Split an array into a pair of arrays based on a conditional function.
 * @param arr - The array to split into 2
 * @param predicate - A function accepting up to 3 arguments. The split function calls the predicate function once per element of the array
 * @param thisArg - An object to which the `this` keyword can refer in the predicate function. If omitted, `undefined` is used as the `this` value
 * @returns A pair of shallowly-copied arrays containing every element for which `predicate` did or did not return a value coercible to the boolean `true`.
 */
export function splitArray<T, S extends T, thisType = undefined>(
  arr: T[],
  predicate: (this: thisType, value: T, index: number, array: T[]) => value is S,
  thisArg?: thisType,
): [matches: S[], nonMatches: S[]];
/**
 * Split an array into a pair of arrays based on a conditional function.
 * @param array - The array to split into 2
 * @param predicate - A function accepting up to 3 arguments. The split function calls the function once per element of the array.
 * @param thisArg -  An object to which the `this` keyword can refer in the predicate function. If omitted, `undefined` is used as the `this` value.
 * @returns A pair of shallowly-copied arrays containing every element for which `predicate` did or did not return a value coercible to the boolean `true`.
 */
export function splitArray<T, thisType = undefined>(
  arr: T[],
  predicate: (this: thisType, value: T, index: number, array: T[]) => unknown,
  thisArg?: thisType,
): [matches: T[], nonMatches: T[]];
export function splitArray<T, thisType = undefined>(
  arr: T[],
  predicate: (this: thisType, value: T, index: number, array: T[]) => unknown,
  thisArg?: thisType,
): [matches: T[], nonMatches: T[]] {
  const matches: T[] = [];
  const nonMatches: T[] = [];

  const p = predicate.bind(thisArg);
  arr.forEach((value, index, array) => {
    if (p(value, index, array)) {
      matches.push(value);
    } else {
      nonMatches.push(value);
    }
  });
  return [matches, nonMatches];
}
