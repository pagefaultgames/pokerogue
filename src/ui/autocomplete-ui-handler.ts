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
      this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width, this.optionSelectBg.height + 50);
    }
  }

  processInput(button: Button): boolean {
    // the cancel and action button are here because if you're typing, x and z are used for cancel/action. This means you could be typing something and accidentally cancel/select when you don't mean to
    // the submit button is therefore used to select a choice (the enter button), though this does not work on my local dev testing for phones, as for my phone/keyboard combo, the enter and z key are both
    // bound to Button.ACTION, which makes this not work on mobile
    if (button !== Button.CANCEL && button !== Button.ACTION) {
      return super.processInput(button);
    }
    return false;
  }
}
