import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectConfig } from "#ui/handlers/abstract-option-select-ui-handler";
import { AbstractOptionSelectUiHandler } from "#ui/handlers/abstract-option-select-ui-handler";
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

  show(args: any[]): boolean {
    if (
      args.length === 5
      && args[0] instanceof Function
      && args[1] instanceof Function
      && args[2] instanceof Function
      && args[3] instanceof Function
      && args[4] === "fullParty"
    ) {
      const config: OptionSelectConfig = {
        options: [
          {
            label: i18next.t("partyUiHandler:summary"),
            handler: () => {
              args[0]();
              return true;
            },
          },
          {
            label: i18next.t("partyUiHandler:pokedex"),
            handler: () => {
              args[1]();
              return true;
            },
          },
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              args[2]();
              return true;
            },
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              args[3]();
              return true;
            },
          },
        ],
        delay: args.length >= 9 && args[8] !== null ? (args[8] as number) : 0,
      };

      super.show([config]);

      this.switchCheck = args.length >= 6 && args[5] !== null && (args[5] as boolean);

      const xOffset = args.length >= 7 && args[6] !== null ? (args[6] as number) : 0;
      const yOffset = args.length >= 8 && args[7] !== null ? (args[7] as number) : 0;

      this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
      return true;
    }
    if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      const config: OptionSelectConfig = {
        options: [
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              args[0]();
              return true;
            },
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              args[1]();
              return true;
            },
          },
        ],
        delay: args.length >= 6 && args[5] !== null ? (args[5] as number) : 0,
        noCancel: args.length >= 7 && args[6] !== null ? (args[6] as boolean) : false,
      };

      super.show([config]);

      this.switchCheck = args.length >= 3 && args[2] !== null && (args[2] as boolean);

      const xOffset = args.length >= 4 && args[3] !== null ? (args[3] as number) : 0;
      const yOffset = args.length >= 5 && args[4] !== null ? (args[4] as number) : 0;

      this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);

      return true;
    }
    return false;
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
