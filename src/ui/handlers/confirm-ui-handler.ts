import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectConfig } from "#ui/base-option-select-ui-handler";
import { BaseOptionSelectUiHandler, isOptionSelectConfig } from "#ui/base-option-select-ui-handler";
import i18next from "i18next";

type OnDeny = () => void;
type OnConfirm = () => void;
type OnPokedex = () => void;
type OnSummary = () => void;
type FullPartyCase = [OnSummary, OnPokedex, OnConfirm, OnDeny, "fullParty", boolean?, number?, number?, number?];
type SecondCase = [
  OnConfirm,
  OnDeny,
  SwitchCheck?: boolean,
  xOffset?: number | null,
  yOffset?: number | null,
  delay?: number,
  noCancel?: boolean,
];

type ConfirmConfig = FullPartyCase | SecondCase;

export class ConfirmUiHandler extends BaseOptionSelectUiHandler<ConfirmConfig> {
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
    const config = args;
    const isFullPartyCaseConfig = isFullPartyCase(config);
    const isSecondCaseConfig = isSecondCase(config);
    const isConfirmConfig = isFullPartyCaseConfig || isSecondCaseConfig;

    if (!isConfirmConfig) {
      return false;
    }

    let optionSelectConfig: OptionSelectConfig;

    if (isFullPartyCaseConfig) {
      optionSelectConfig = {
        options: [
          {
            label: i18next.t("partyUiHandler:summary"),
            handler: () => {
              config[0]();
              return true;
            },
          },
          {
            label: i18next.t("partyUiHandler:pokedex"),
            handler: () => {
              config[1]();
              return true;
            },
          },
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              config[2]();
              return true;
            },
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              config[3]();
              return true;
            },
          },
        ],
        delay: config.length >= 9 && typeof config[8] === "number" ? config[8] : 0,
      };

      this.switchCheck = config.length >= 6 && typeof config[5] === "boolean" && config[5];

      const xOffset = config.length >= 7 && typeof config[6] === "number" ? config[6] : 0;
      const yOffset = config.length >= 8 && typeof config[7] === "number" ? config[7] : 0;

      this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
    } else {
      optionSelectConfig = { options: [] };
    }

    if (isSecondCaseConfig) {
      optionSelectConfig = {
        options: [
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              config[0]();
              return true;
            },
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              config[1]();
              return true;
            },
          },
        ],
        delay: config.length >= 6 && typeof config[5] === "number" ? config[5] : 0,
        noCancel: config.length >= 7 && typeof config[6] === "boolean" ? config[6] : false,
      };

      this.switchCheck = config.length >= 3 && typeof config[2] === "boolean" && config[2];

      const xOffset = config.length >= 4 && typeof config[3] === "number" ? config[3] : 0;
      const yOffset = config.length >= 5 && typeof config[4] === "number" ? config[4] : 0;

      this.optionSelectContainer.setPosition(globalScene.scaledCanvas.width - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
    }

    if (!isOptionSelectConfig(optionSelectConfig)) {
      return false;
    }

    // Bypass mutates expect argument from parent abstract class
    super.show([optionSelectConfig] as unknown as ConfirmConfig);
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

function isFullPartyCase(obj): obj is FullPartyCase {
  return (
    obj.length === 5
    && obj[0] instanceof Function
    && obj[1] instanceof Function
    && obj[2] instanceof Function
    && obj[3] instanceof Function
    && obj[4] === "fullParty"
  );
}

function isSecondCase(obj): obj is SecondCase {
  return obj.length >= 2 && obj[0] instanceof Function && obj[1] instanceof Function;
}
