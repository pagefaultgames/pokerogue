import BattleScene from "../battle-scene";
import OptionSelectUiHandler from "./option-select-ui-handler";
import { Mode } from "./ui";

export default class ConfirmUiHandler extends OptionSelectUiHandler {
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

  show(args: any[]) {
    if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      super.show(args);
      
      this.switchCheck = args.length >= 3 && args[2] as boolean;

      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
    }
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (ret && this.switchCheck)
      this.switchCheckCursor = this.cursor;

    return ret;
  }
}