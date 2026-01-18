import type { TOptions } from "i18next";

// Module declared to make referencing keys in the localization files type-safe.
// TODO: This effectively overrides i18next's builtin typings - we should use
// https://github.com/ahrjarrett/i18next-selector/tree/main/packages/vite-plugin or similar to autogen `.d.ts` files periodically
declare module "i18next" {
  interface TFunction {
    // biome-ignore lint/style/useShorthandFunctionType: This needs to be an interface due to interface merging
    (key: string | string[], options?: TOptions & Record<string, unknown>): string;
  }
}
