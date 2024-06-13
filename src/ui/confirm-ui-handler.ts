import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler, { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";
import i18next from "i18next";
import {Button} from "#enums/buttons";

export default class ConfirmUiHandler extends AbstractOptionSelectUiHandler {

  public static readonly windowWidth: integer = 48;

  private switchCheck: boolean;
  private switchCheckCursor: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.CONFIRM);
  }

  getWindowWidth(): integer {
    return ConfirmUiHandler.windowWidth;
  }

  show(args: any[]): boolean {
    if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      const config: OptionSelectConfig = {
        options: [
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              args[0]();
              return true;
            }
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              args[1]();
              return true;
            }
          }
        ],
        delay: args.length >= 6 && args[5] !== null ? args[5] as integer : 0
      };

      super.show([ config ]);

      this.switchCheck = args.length >= 3 && args[2] !== null && args[2] as boolean;

      const xOffset = (args.length >= 4 && args[3] !== null ? args[3] as number : 0);
      const yOffset = (args.length >= 5 && args[4] !== null ? args[4] as number : 0);

      this.optionSelectContainer.setPosition((this.scene.game.canvas.width / 6) - 1 + xOffset, -48 + yOffset);

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);

      return true;
    }

    return false;
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
