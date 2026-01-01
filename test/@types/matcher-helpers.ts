/**
 * Module containing various internal types for use inside `vitest.d.ts`.
 * These are not meant for external use.
 * @module
 */

import type { If } from "type-fest";

/**
 * Internal helper type to restrict matchers' properties based on the type of `T`.
 * If it does not extend `R`, all methods inside `M` will have their types resolved to `never`.
 * @typeParam M - The type of the matchers object to restrict
 * @typeParam R - The type to restrict `T` based off of
 * @typeParam T - The type parameter of the assertion
 * @privateRemarks
 * We cannot remove incompatible methods outright as TypeScript requires that
 * interfaces both contain and extend off of types with statically known members.
 * @internal
 * @package
 */
export type RestrictMatcher<M extends object, R, T> = {
  [k in keyof M]: T extends R ? M[k] : never;
};

// TODO: Replace the prior `AnyFn` declaration with this one - this is a proper "top type"
type AnyFn<Args extends readonly unknown[] = never, Return = unknown> = (...args: Args) => Return;

/**
 * Type representing an object containing some number of matchers.
 * @interface
 * @internal
 */
export type MatcherInterface<K extends string> = Record<K, AnyFn<never, void>>;

/**
 * Interface describing the shape of a set of custom matchers, used to allow strongly typing both
 * positive and negative assertions with different values for each.
 * @typeParam K - The key type of `common`, used to ensure that `positive` and `negative` only contain a subset of
 * `common`'s properties.
 * @internal
 * @remarks
 * Consumers that do not need custom types for positive and negative assertions should instead use plain interfaces.
 * @privateRemarks
 * **DO NOT EXTEND OFF OF THIS INTERFACE!!** \
 * Instead, implement it with a `declare class` statement - this provides IDE autocomplete without adding additional properties.
 *
 * This is required as there's no clean way to ensure that 2 interfaces are assignable inside a `.d.ts` file without using `extends`.
 * @example
 * ```ts
 * declare class MyCustomMatchers implements MatchersBase<keyof MyCustomMatchersCommon> {
 *   common: MyCustomMatchersCommon,
 *   positive: MyCustomMatchersPositive,
 *   negative: MyCustomMatchersNegative,
 * }
 *
 * interface MyCustomMatchersCommon
 * ```
 */
export interface MatchersBase<K extends string> {
  /** Signatures common to both positive and negative assertions. */
  common: MatcherInterface<K>;
  /** Signatures exclusive to positive assertions. */
  positive?: Partial<MatcherInterface<K>>;
  /** Properties exclusive to negative assertions. */
  negative?: Partial<MatcherInterface<K>>;
}

/**
 * Internal helper type to resolve the type of a given matcher based on a negative or positive assertion.
 * @typeParam M - The matcher object to resolve; will be returned verbatim if it does not extend from {@linkcode MatchersBase}
 * @typeParam Negative - Whether the assertion is occurring in a negative position (via `.not`)
 * @internal
 * @package
 */
export type GetMatchers<
  M extends object,
  Negative extends boolean,
  NegativeKey extends "negative" | "positive" = If<Negative, "negative", "positive">,
  // Hand-rolling the `extends` provides 2 benefits:
  // 1. Allows this to work on types that don't have custom negative/positive annotations
  // 2. Avoids index signature issues with `Record<string>`/etc.
> = [M] extends [MatchersBase<infer K extends string>]
  ? {
      // NB: This ALL needs to be inside the mapped object type here to allow TS to resolve interface keys statically.
      [key in K]: [M[NegativeKey]] extends [(infer C extends NonNullable<M[NegativeKey]>) | undefined]
        ? M["common"][key] & NonNullable<C[key]>
        : M["common"][key];
    }
  : M;
