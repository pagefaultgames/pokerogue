import type { AtLeastOne, NonFunctionPropertiesRecursive as nonFunc } from "#types/type-helpers";

/**
 * Helper type to admit an object containing the given properties
 * _and_ at least 1 other non-function property.
 * @example
 * ```ts
 * type foo = {
 *   qux: 1 | 2 | 3,
 *   bar: number,
 *   baz: string
 *   quux: () => void; // ignored!
 * }
 *
 * type quxAndSomethingElse = OneOther<foo, "qux">
 *
 * const good1: quxAndSomethingElse = {qux: 1, bar: 3} // OK!
 * const good2: quxAndSomethingElse = {qux: 2, baz: "4", bar: 12} // OK!
 * const bad1: quxAndSomethingElse = {baz: "4", bar: 12} // Errors because `qux` is required
 * const bad2: quxAndSomethingElse = {qux: 1} // Errors because at least 1 thing _other_ than `qux` is required
 * ```
 * @typeParam O - The object to source keys from
 * @typeParam K - One or more of O's keys to render mandatory
 */
export type OneOther<O extends object, K extends keyof O> = AtLeastOne<Omit<nonFunc<O>, K>> & {
  [key in K]: O[K];
};
