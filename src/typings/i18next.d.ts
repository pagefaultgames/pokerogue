import type { TOptions } from "i18next";

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
  interface TFunction {
    // biome-ignore lint/style/useShorthandFunctionType: This needs to be an interface due to interface merging
    (key: string | string[], options?: TOptions & Record<string, unknown>): string;
  }
}
