import { Button } from "#enums/buttons";
import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class AutoCompleteUiHandler extends AbstractOptionSelectUiHandler {
  modalContainer: Phaser.GameObjects.Container;
  constructor(scene: BattleScene, mode: Mode = Mode.OPTION_SELECT) {
    super(scene, mode);
  }

  getWindowWidth(): integer {
    return 64;
  }

  show(args: any[]): boolean {
    if (args[0].modalContainer) {
      const { modalContainer } = args[0];
      const show = super.show(args);
      this.modalContainer = modalContainer;
      this.setupOptions();

      return show;
    }
    return false;
  }
  protected setupOptions() {
    super.setupOptions();
    if (this.modalContainer) {
      this.optionSelectContainer.setSize(this.optionSelectContainer.height, Math.max(this.optionSelectText.displayWidth + 24, this.getWindowWidth()));
      this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width * 0.78, this.optionSelectBg.height + 50);
    }
  }
  processInput(button: Button): boolean {
    if (button !== Button.CANCEL) {
      return super.processInput(button);
    }
    return false;
  }
}
