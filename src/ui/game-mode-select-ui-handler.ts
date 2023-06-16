import BattleScene from "../battle-scene";
import OptionSelectUiHandler from "./option-select-ui-handler";
import { Mode } from "./ui";

export default class GameModeSelectUiHandler extends OptionSelectUiHandler {

  constructor(scene: BattleScene) {
    super(scene, Mode.GAME_MODE_SELECT);
  }

  getWindowWidth(): integer {
    return 64;
  }

  getWindowHeight(): number {
    return 64;
  }

  getOptions(): string[] {
    return [ 'Classic', 'Endless', 'Cancel' ];
  }
}