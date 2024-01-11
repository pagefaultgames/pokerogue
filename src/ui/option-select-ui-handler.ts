import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  constructor(scene: BattleScene) {
    super(scene, Mode.OPTION_SELECT);
  }

  getWindowWidth(): integer {
    return 64;
  }
}