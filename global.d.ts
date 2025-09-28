import type { AnyFn } from "#types/type-helpers";
import type { SetupServerApi } from "msw/node";

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

  // Type-safe aliases for `Object.keys` when working with string records
  interface ObjectConstructor {
    keys<O extends Record<string, unknown>>(o: O): keyof O[];
  }
}

// Global augments for `typedoc` to prevent TS from erroring when editing the config JS file
declare module "typedoc" {
  export interface TypeDocOptionMap {
    coverageLabel: string;
    coverageColor: string;
    coverageOutputPath: string;
    coverageOutputType: "svg" | "json" | "all";
    coverageSvgWidth: number;
  }
}
