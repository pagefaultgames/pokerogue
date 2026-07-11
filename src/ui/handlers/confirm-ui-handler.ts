import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectConfig } from "#ui/base-option-select-ui-handler";
import { BaseOptionSelectUiHandler } from "#ui/base-option-select-ui-handler";
import i18next from "i18next";

type FullPartyCaseConfig = [
  OnSummary: () => void,
  OnPokedex: () => void,
  OnConfirm: () => void,
  OnDeny: () => void,
  "fullParty",
  SwitchCheck?: boolean,
  xOffset?: number,
  yOffset?: number,
  Delay?: number,
];

type CommonCaseConfig = [
  OnConfirm: () => void,
  OnDeny: () => void,
  SwitchCheck?: boolean,
  xOffset?: number | null,
  yOffset?: number | null,
  Delay?: number,
  NoCancel?: boolean,
];

type ConfirmConfig = FullPartyCaseConfig | CommonCaseConfig;

export class ConfirmUiHandler extends BaseOptionSelectUiHandler<any> {
  public static readonly windowWidth: number = 48;

  private switchCheck: boolean;
  private switchCheckCursor: number;

  constructor() {
    super(UiMode.CONFIRM);
  }

  getWindowWidth(): number {
    return ConfirmUiHandler.windowWidth;
  }

  show(args: ConfirmConfig): boolean {
    const isFullPartyCaseConfig =
      args.length >= 5
      && args[0] instanceof Function
      && args[1] instanceof Function
      && args[2] instanceof Function
      && args[3] instanceof Function
      && args[4] === "fullParty";
    const isCommonCaseConfig = args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function;
    const isConfirmConfig = isFullPartyCaseConfig || isCommonCaseConfig;

    if (!isConfirmConfig) {
      return false;
    }

    let optionSelectConfig: OptionSelectConfig = {
      options: [],
    };
    let xOffset = 0;
    let yOffset = 0;

    if (isFullPartyCaseConfig) {
      optionSelectConfig = {
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
        delay: typeof args[8] === "number" ? args[8] : 0,
      };

      this.switchCheck = typeof args[5] === "boolean" && args[5];

      xOffset = typeof args[6] === "number" ? args[6] : 0;
      yOffset = typeof args[7] === "number" ? args[7] : 0;
    } else if (isCommonCaseConfig) {
      optionSelectConfig = {
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
        delay: typeof args[5] === "number" ? args[5] : 0,
        noCancel: typeof args[6] === "boolean" ? args[6] : false,
      };

      this.switchCheck = typeof args[2] === "boolean" && args[2];

      xOffset = typeof args[3] === "number" ? args[3] : 0;
      yOffset = typeof args[4] === "number" ? args[4] : 0;
    }

    this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);
    this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);

    super.show([optionSelectConfig] satisfies Parameters<BaseOptionSelectUiHandler["show"]>[0]);
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
