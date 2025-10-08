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
