import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler, { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";
import i18next from "i18next";
import {Button} from "#enums/buttons";

export enum PreviewMode {
  CATCH_SUMMARY,
  SAVE_PREVIEW
}

export default class ConfirmPreviewUiHandler extends AbstractOptionSelectUiHandler {

  public static readonly windowWidth: integer = 48;

  private switchCheck: boolean;
  private switchCheckCursor: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.CONFIRM);
  }

  getWindowWidth(): integer {
    return ConfirmPreviewUiHandler.windowWidth;
  }

  determineLabels(mode: PreviewMode): string[] {
    const yes = i18next.t("menu:yes");
    const no = i18next.t("menu:no");
    switch (previewMode) {
    case PreviewMode.CATCH_SUMMARY:
      return [i18next.t("partyUiHandler:SUMMARY"), yes, no];
    case PreviewMode.SAVE_PREVIEW:
      return [yes, i18next.t(""), no];
    default:
      return ["", "", ""];
    }
  }

  show(args: any[]): boolean {
    const labels = this.determineLabels(args[3]);
    const config: OptionSelectConfig = {
      options: [
        {
          label: labels[0],
          handler: () => {
            args[0]();
            return true;
          },
        }, {
          label: labels[1],
          handler: () => {
            args[1]();
            return true;
          }
        }, {
          label: labels[2],
          handler: () => {
            args[2]();
            return true;
          }
        }
      ],
      delay: args.length >= 8 && args[7] !== null ? args[7] as integer : 0
    };

    super.show([ config ]);

    this.switchCheck = args.length >= 5 && args[4] !== null && args[4] as boolean;

    const xOffset = (args.length >= 6 && args[5] !== null ? args[5] as number : 0);
    const yOffset = (args.length >= 7 && args[6] !== null ? args[6] as number : 0);

    this.optionSelectContainer.setPosition((this.scene.game.canvas.width / 6) - 1 + xOffset, -48 + yOffset);

    this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.CANCEL && this.blockInput) {
      this.unblockInput();
    }

    return super.processInput(button);
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (ret && this.switchCheck) {
      this.switchCheckCursor = this.cursor;
    }

    return ret;
  }
}
