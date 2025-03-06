import type { TOptions } from "i18next";

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
  type TFunction = (key: string | string[], options?: TOptions & Record<string, unknown>) => string
}
