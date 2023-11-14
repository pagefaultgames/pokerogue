import BattleScene, { Button } from "../battle-scene";
import { GameMode, gameModeNames } from "../game-mode";
import { Unlockables } from "../system/unlockables";
import AbstractOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class GameModeSelectUiHandler extends AbstractOptionSelectUiHandler {

  constructor(scene: BattleScene) {
    super(scene, Mode.GAME_MODE_SELECT);
  }

  getWindowWidth(): integer {
    return 104;
  }

  getWindowHeight(): number {
    return (this.getOptions().length + 1) * 16;
  }

  getOptions(): string[] {
    const ret = [ gameModeNames[GameMode.CLASSIC] ];
    if (this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
      ret.push(gameModeNames[GameMode.ENDLESS]);
      if (this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE])
        ret.push(gameModeNames[GameMode.SPLICED_ENDLESS]);
    }
    ret.push('Cancel');
    return ret;
  }

  show(args: any[]) {
    if (args.length === 2 && args[0] instanceof Function && args[1] instanceof Function) {
      this.setupOptions();
      
      super.show(args);
      
      this.handlers = args as Function[];

      this.optionSelectContainer.setVisible(true);
      this.setCursor(0);
    }
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    const options = this.getOptions();

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (button === Button.CANCEL)
        this.setCursor(options.length - 1);
      if (this.cursor < options.length - 1) {
        const gameMode = Object.values(gameModeNames).indexOf(options[this.cursor]) as GameMode;
        this.handlers[0](gameMode);
      } else
        this.handlers[1]();
      this.clear();
      ui.playSelect();
    } else
      return super.processInput(button);

    return true;
  }
}