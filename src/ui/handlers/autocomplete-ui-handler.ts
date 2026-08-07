import { Button } from "#enums/buttons";
import type { UIOptionSelectItem } from "#types/ui-types";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import type Phaser from "phaser";

export class AutoCompleteUiHandler extends OptionSelectUiHandler {
  private modalContainer?: Phaser.GameObjects.Container;

  public override show(args: any[]): boolean {
    if (args[0]?.modalContainer) {
      const { modalContainer } = args[0];
      this.modalContainer = modalContainer;

      return super.show(args);
    }

    return false;
  }

  protected override updateSizeForOptions(options: UIOptionSelectItem[]): void {
    super.updateSizeForOptions(options);

    if (this.modalContainer) {
      this.optionSelectContainer.setPositionRelative(
        this.modalContainer,
        this.optionSelectBg.width,
        this.optionSelectBg.height + 50,
      );
    }
  }

  public override processInput(button: Button): boolean {
    const ui = this.getUi();

    if (button === Button.SUBMIT) {
      const option = this.currentOption;

      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
        if (!option.noSoundEffects) {
          ui.playSelect();
        }
      } else {
        ui.playError();
      }

      return true;
    }

    if (button !== Button.CANCEL && button !== Button.ACTION) {
      return super.processInput(button);
    }

    return false;
  }
}
