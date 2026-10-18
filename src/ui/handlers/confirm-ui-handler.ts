import { UiMode } from "#enums/ui-mode";
import type { ConfirmModeConfig, OptionSelectModeConfig } from "#types/ui-types";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import i18next from "i18next";

/** Handler that displays a simple Yes/No menu. */
export class ConfirmUiHandler extends OptionSelectUiHandler {
  constructor() {
    super(UiMode.CONFIRM);
  }

  public override show(args: any[]): boolean {
    const config: ConfirmModeConfig | undefined = args[0];

    if (!config?.yesHandler || !config.noHandler) {
      console.warn("Missing `ConfirmModeConfig` argument for `UiMode.CONFIRM`");
      return false;
    }

    const fullConfig: OptionSelectModeConfig = {
      ...config,
      yOffset: config.yOffset ?? 48,
      options: [
        {
          label: i18next.t("menu:yes"),
          handler: () => {
            config.yesHandler();
            return true;
          },
        },
        {
          label: i18next.t("menu:no"),
          handler: () => {
            config.noHandler();
            return true;
          },
        },
      ],
    };

    return super.show([fullConfig]);
  }
}
