import BattleScene from "../battle-scene";
import { GameMode, gameModeNames } from "../game-mode";
import { Unlockables } from "../system/unlockables";
import AbstractOptionSelectUiHandler, { OptionSelectConfig, OptionSelectItem } from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class GameModeSelectUiHandler extends AbstractOptionSelectUiHandler {

  constructor(scene: BattleScene) {
    super(scene, Mode.GAME_MODE_SELECT);
  }

  getWindowWidth(): integer {
    return 104;
  }

  show(args: any[]): boolean {
    if (args.length === 2 && args[0] instanceof Function && args[1] instanceof Function) {
      const options: OptionSelectItem[] = [
        {
          label: gameModeNames[GameMode.CLASSIC],
          handler: () => args[0](GameMode.CLASSIC)
        }
      ];

      if (this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
        options.push({
          label: gameModeNames[GameMode.ENDLESS],
          handler: () => args[0](GameMode.ENDLESS)
        });
        if (this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
          options.push({
            label: gameModeNames[GameMode.SPLICED_ENDLESS],
            handler: () => args[0](GameMode.SPLICED_ENDLESS)
          });
        }
      }

      options.push({
        label: 'Cancel',
        handler: args[1]
      })

      const config: OptionSelectConfig = {
        options: options
      };
      
      super.show([ config ]);

      this.optionSelectContainer.setVisible(true);
      this.setCursor(0);

      return true;
    }

    return false;
  }
}