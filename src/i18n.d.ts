import "i18next";
import { TOptions } from "i18next";

declare module "i18next" {
  interface TFunction {
    (
      key: string | string[],
      options?: TOptions & Record<string, unknown> & { defaultValue: string }
    ): string;
  }
}
