import type { Stringable, Stringify, Unstringify } from "#types/strings";
import type { PreventHoverExpansion } from "#types/type-helpers";
import type { SetupServer } from "msw/node";

// #region Object-related types

/**
 * A key that can be stringified.
 * @privateRemarks
 * Equivalent to `string | number`.
 * @internal
 */
type StringableKey = Stringable & PropertyKey;

/**
 * Augmented type of {@linkcode Object.entries}.
 * @internal
 */
type ObjectEntries<O extends Partial<Record<StringableKey, unknown>>> = PreventHoverExpansion<
  O extends unknown ? readonly ObjectEntry<Required<O>>[] : never
>;

/**
 * Internal helper for {@linkcode ObjectEntries}.
 * @internal
 */
type ObjectEntry<O extends Record<StringableKey, unknown>> = readonly [Stringify<keyof O>, O[keyof O]];

/**
 * Augmented type of {@linkcode Object.fromEntries}.
 * Unwraps types from {@linkcode ObjectEntries} to allow for round-tripping.
 */
type FromEntries<E extends Iterable<readonly [StringableKey, unknown]>> =
  E extends Iterable<readonly [infer K extends StringableKey, infer V]> ? Record<Unstringify<K>, V> : never;

// #endregion Object-related types

// #region Declaration merges

declare global {
  /**
   * An MSW HTTP server, used to load i18n locale files during normal tests and serve mock
   * HTTP requests during API tests.
   *
   * ⚠️ Should not be used in production code, as it is only populated during test runs!
   */
  var server: SetupServer;

  // Overloads for `Object.keys` and company to return arrays of strongly typed keys on compatible objects.
  // NOTE: These are technically unsound due to structural typing allowing excess properties, but extremely useful nonetheless
  // as the cases where these functions are used are those where nominal typing is both useful and actively expected.
  // TODO: Consider creating a branded type to indicate closed objects and prevent unsoundness (though it would require a lot of changes)
  interface ObjectConstructor {
    keys<K extends StringableKey>(o: Partial<Record<K, unknown>>): readonly Stringify<K>[];
    entries<const O extends Partial<Record<StringableKey, unknown>>>(o: O): ObjectEntries<O>;
    fromEntries<const E extends Iterable<readonly [StringableKey, unknown]>>(entries: E): FromEntries<E>;
  }

  // Coerce numeric strings inside `Number()` casts to their numeric equivalents, and vice versa for base-10 stringification.
  // Since TS requires numeric strings to be round-trippable to be assignable to `${number}` (`String(Number(myStr)) === myStr`),
  // this is always safe when the overload matches.
  interface NumberConstructor {
    // NB: I would make this produce NaN if an invalid string is passed, but that just becomes `number`...
    new <N extends number>(value: Stringify<N>): N;
    <N extends number>(value: Stringify<N>): N;
    parseInt<N extends number>(string: Stringify<N>, radix?: 10): N;
  }
  interface Number {
    toString<T extends number>(this: T, radix?: 10): Stringify<T>;
  }

  // Propagate number types from coercing things that are already known to be numbers (and avoid widening the type)
  // TODO: Calling `Number()` on an already-numeric value is pointless and we should arguably produce type errors instead
  interface NumberConstructor {
    new <N extends number>(value: N): N;
    <N extends number>(value: N): N;
  }

  // Override for `Array.isArray` to not remove `readonly`-ness from arrays known to be readonly
  interface ArrayConstructor {
    isArray<T>(arg: readonly T[]): arg is readonly T[];
  }
}

// Global augments for `typedoc` to prevent TS from erroring when editing the config JS file
// TODO: This should be provided by the extensions in question, so why isn't TypeScript picking it up?
declare module "typedoc" {
  export interface TypeDocOptionMap {
    // typedoc-plugin-coverage
    coverageLabel: string;
    coverageColor: string;
    coverageOutputPath: string;
    coverageOutputType: "svg" | "json" | "all";
    coverageSvgWidth: number;
    // typedoc-plugin-missing-exports
    internalModule: string;
    placeInternalsInOwningModule: boolean;
    collapseInternalModule: boolean;
    includeDocCommentReferences: boolean;
  }
}

// #endregion Declaration merges

// biome-ignore lint/complexity/noUselessEmptyExport: Prevents exporting helper types
export {};
