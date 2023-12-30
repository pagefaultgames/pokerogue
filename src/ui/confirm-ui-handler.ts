import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class ConfirmUiHandler extends AbstractOptionSelectUiHandler {
  private switchCheck: boolean;
  private switchCheckCursor: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.CONFIRM);
  }

  getWindowWidth(): integer {
    return 48;
  }

  getWindowHeight(): integer {
    return 48;
  }

  getOptions(): string[] {
    return [ 'Yes', 'No' ];
  }

  show(args: any[]): boolean {
    if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      super.show(args);
      
      this.switchCheck = args.length >= 3 && args[2] as boolean;

      const xOffset = (args.length >= 4 ? -args[3] as number : 0);

      this.optionSelectContainer.x = (this.scene.game.canvas.width / 6) - 1 + xOffset;

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);

      return true;
    }

    return false;
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (ret && this.switchCheck)
      this.switchCheckCursor = this.cursor;

    return ret;
  }
}