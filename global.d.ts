import type { AnyFn } from "#types/type-helpers";
import type { SetupServerApi } from "msw/node";
import { StringifyOptions } from "@vitest/utils";
import type { Stringify, Stringable } from "#types/strings";
import type { AbstractConstructor } from "type-fest";

type getObjectEntries<O extends object> = {
  [K in Extract<keyof O, Stringable>]: [Stringify<K>, O[K]];
}[Extract<keyof O, Stringable>][];

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

  // Overloads for `Object.keys` and company to return strongly typed keys on objects with known types.
  // NOTE: These are technically unsound due to structural typing, but extremely useful nonetheless.
  // (Technically, so is `Object.values` not returning `any[]`...)
  interface ObjectConstructor {
    keys<O extends Record<keyof any, unknown>>(o: O): Stringify<Extract<keyof O, Stringable>>[];
    entries<O extends Record<keyof any, unknown>>(o: O): getObjectEntries<O>;
  }

  // Coerce string-like numbers to strings inside `Number()` casts
  interface NumberConstructor {
    new <S extends string>(value: S): S extends `${infer N extends number}` ? N : typeof NaN;
    <S extends string>(value: S): S extends `${infer N extends number}` ? N : typeof NaN;
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

// biome-ignore lint/complexity/noUselessEmptyExport: Prevents exporting helper types
export {};
