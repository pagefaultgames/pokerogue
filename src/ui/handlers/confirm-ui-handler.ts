import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { AbstractOptionSelectUiHandler } from "#ui/abstract-option-select-ui-handler";
import type { ConfirmUiHandlerParams } from "#ui/ui-handler-params";
import type { OptionSelectConfig } from "#ui/ui-types";
import i18next from "i18next";

export class ConfirmUiHandler extends AbstractOptionSelectUiHandler {
  public static readonly windowWidth: number = 48;

  private switchCheck: boolean;
  private switchCheckCursor: number;

  constructor() {
    super(UiMode.CONFIRM);
  }

  getWindowWidth(): number {
    return ConfirmUiHandler.windowWidth;
  }

  show(args: ConfirmUiHandlerParams): boolean {
    if (args.onSummary && args.onPokedex) {
      const config: OptionSelectConfig = {
        options: [
          {
            label: i18next.t("partyUiHandler:summary"),
            handler: () => {
              args.onSummary!();
              return true;
            },
          },
          {
            label: i18next.t("partyUiHandler:pokedex"),
            handler: () => {
              args.onPokedex!();
              return true;
            },
          },
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              args.onYes();
              return true;
            },
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              args.onNo();
              return true;
            },
          },
        ],
        delay: args.delay ?? 0,
      };

      super.show(config);

      this.switchCheck = !!args.switchCheck;
      const xOffset = args.xOffset ?? 0;
      const yOffset = args.yOffset ?? 0;

      this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
      return true;
    }

    const config: OptionSelectConfig = {
      options: [
        {
          label: i18next.t("menu:yes"),
          handler: () => {
            args.onYes();
            return true;
          },
        },
        {
          label: i18next.t("menu:no"),
          handler: () => {
            args.onNo();
            return true;
          },
        },
      ],
      delay: args.delay ?? 0,
      noCancel: !!args.noCancel,
    };

    super.show(config);

    this.switchCheck = !!args.switchCheck;
    const xOffset = args.xOffset ?? 0;
    const yOffset = args.yOffset ?? 0;

    this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

    this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);

    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.CANCEL && this.blockInput && !this.config?.noCancel) {
      this.unblockInput();
    }

    return super.processInput(button);
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (ret && this.switchCheck) {
      this.switchCheckCursor = this.cursor;
    }

    return ret;
  }
}
