import type { SetupServerApi } from "msw/node";

declare global {
  /**
   * An MSW HTTP server, used to load i18n locale files during normal tests and serve mock
   * HTTP requests during API tests.
   *
   * ⚠️ Should not be used in production code, as it is only populated during test runs!
   */
  var server: SetupServerApi;
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
