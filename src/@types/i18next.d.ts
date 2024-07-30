import { type enConfig } from "#app/locales/en/config.js";

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
    interface CustomTypeOptions {
      defaultNS: "menu", // needed here as well for typedoc
      resources: typeof enConfig
    }
  }
