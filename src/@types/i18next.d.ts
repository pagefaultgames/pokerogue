import { type enConfig } from "#app/locales/en/config.js";
import { TOptions } from "i18next";

//TODO: this needs to be type properly in the future
// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
    interface CustomTypeOptions {
      defaultNS: "menu", // needed here as well for typedoc
      resources: typeof enConfig
    }

    interface TFunction {
      (
        key: string | string[],
        options?: TOptions & Record<string, unknown>
      ): string;
    }
  }
