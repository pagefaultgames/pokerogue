import BattleScene from "../../battle-scene";
import AbstractOptionSelectUiHandler from "../abstact-option-select-ui-handler";
import { Mode } from "../ui";

export default class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  constructor(scene: BattleScene, mode: Mode = Mode.OPTION_SELECT) {
    super(scene, mode);
  }

  getWindowWidth(): integer {
    return 64;
  }
}
