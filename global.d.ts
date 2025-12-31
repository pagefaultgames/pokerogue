import { PokeballCounts } from "#app/battle-scene";
import { PokeballType } from "#enums/pokeball";
import type { Stringable, Stringify, Unstringify } from "#types/strings";
import type { AnyFn } from "#types/type-helpers";
import { StringifyOptions } from "@vitest/utils";
import type { SetupServerApi } from "msw/node";
import type {
  AbstractConstructor,
  Entries,
  IsEqual,
  OmitIndexSignature,
  Tagged,
  TupleOf,
  UnionToTuple,
} from "type-fest";

// #region Object-related types
type getObjectKeys<Keys extends PropertyKey> = Stringify<Extract<Keys, Stringable>>[];

declare const origObjectTag: unique symbol;
/**
 * Augmented type of {@linkcode Object.entries}.
 * Uses a tagged union to allow {@linkcode fromEntries} to resolve the type correctly.
 */
type getObjectEntries<O extends object> = Tagged<ObjectEntry<O>[], typeof origObjectTag, O>;

type ObjectEntry<O extends object> = {
  [K in Extract<keyof O, Stringable>]: [Stringify<K>, O[K]];
}[Extract<keyof O, Stringable>];

type fromEntries<E extends Iterable<readonly [PropertyKey, unknown]>> =
  E extends Tagged<unknown, typeof origObjectTag, infer Base extends object>
    ? Base
    : E extends Iterable<readonly [infer K extends PropertyKey, infer V]>
      ? Record<Unstringify<K>, V>
      : never;

// #endregion Object-related code

declare global {
  /**
   * Only used in testing.
   * Can technically be undefined/null but for ease of use we are going to assume it is always defined.
   * Used to load i18n files exclusively.
   *
   * To set up your own server in a test see `game-data.test.ts`
   */
  var server: SetupServerApi;

  // Overloads for `Function.apply` and `Function.call` to add type safety on matching argument types
  interface Function {
    apply<T extends AnyFn>(this: T, thisArg: ThisParameterType<T>, argArray: Parameters<T>): ReturnType<T>;

    call<T extends AnyFn>(this: T, thisArg: ThisParameterType<T>, ...argArray: Parameters<T>): ReturnType<T>;
  }

  // Overloads for `Object.keys` and company to return tuples of strongly typed keys on compatible objects.
  // NOTE: These are technically unsound due to structural typing, but extremely useful nonetheless as the cases where we are using
  // these functions are ones where structural typing would be a hindrance.
  interface ObjectConstructor {
    keys<K extends PropertyKey>(o: Record<K, unknown>): getObjectKeys<K>;
    entries<O extends Record<PropertyKey, unknown>>(o: O): getObjectEntries<O>;
    fromEntries<Entry extends readonly [PropertyKey, unknown], E extends Iterable<Entry>>(entries: E): fromEntries<E>;
  }

  // Coerce string-like numbers to strings inside `Number()` casts, and vice versa for base-10 `parseInt/toString` calls
  interface NumberConstructor {
    new <S extends string>(value: S): S extends `${infer N extends number}` ? N : typeof NaN;
    <S extends string>(value: S): S extends `${infer N extends number}` ? N : typeof NaN;

    parseInt<N extends number>(string: `${N}`, radix?: 10): N;
  }
  // interface Number {
  //   toString<T extends number>(this: T, radix?: 10): Stringify<T>;
  // }
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

// biome-ignore lint/complexity/noUselessEmptyExport: Prevents exporting helper types
export {};
