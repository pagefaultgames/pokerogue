import type { TOptions } from "i18next";

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
  interface TFunction {
    // biome-ignore lint/style/useShorthandFunctionType: IDK why this breaks everything but it does
    (key: string | string[], options?: TOptions & Record<string, unknown>): string;
  }
}
