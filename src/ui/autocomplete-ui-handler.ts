import { Button } from "#enums/buttons";
import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler, { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";
import InputText from "phaser3-rex-plugins/plugins/inputtext";

export interface OptionSelectConfigAC extends OptionSelectConfig {
  inputContainer: Phaser.GameObjects.Container;
  modalContainer: Phaser.GameObjects.Container;
  maxOptionsReverse?: number;
  reverse?: true; // So that instead of showing the options looking below the input, they are shown above
}

export default class AutoCompleteUiHandler extends AbstractOptionSelectUiHandler {
  modalContainer: Phaser.GameObjects.Container;
  inputContainer: Phaser.GameObjects.Container;
  reverse?: true;

  constructor(scene: BattleScene, mode: Mode = Mode.AUTO_COMPLETE) {
    super(scene, mode);
    this.handlerKeyDown = this.handlerKeyDown.bind(this);
  }

  getWindowWidth(): integer {
    return 0;
  }

  show(args: any[]): boolean {
    if (args[0].modalContainer && args[0].inputContainer && args[0].inputContainer.list.some((el) => el instanceof InputText)) {
      const { modalContainer, inputContainer, reverse } = args[0] as OptionSelectConfigAC;
      const newArgs = JSON.parse(JSON.stringify(args));
      this.reverse = reverse;

      newArgs[0].options?.forEach((opt, index)=>{
        const originalHandler = args[0].options[index].handler;
        opt.handler = () => {
          if (originalHandler()) {
            this.revertAutoCompleteMode();
            return true;
          }
          return false;
        };
      });
      this.modalContainer = modalContainer;
      this.inputContainer = inputContainer;
      const input = args[0].inputContainer.list.find((el) => el instanceof InputText);

      const originalsEvents = input.listeners("keydown");
      // Remove the current keydown events from the input so that the one added in this mode is executed first
      for (let i = 0; i < originalsEvents?.length; i++) {
        input.off("keydown", originalsEvents[i]);
      }

      input.on("blur", this.revertAutoCompleteMode);
      input.on("keydown", this.handlerKeyDown);
      this.modalContainer.on("pointerdown", this.revertAutoCompleteMode);

      // After adding the event that will execute this mode first, return the ones it already had
      for (let i = 0; i < originalsEvents?.length; i++) {
        input.on("keydown", originalsEvents[i]);
      }

      if (this.reverse) {
        if (newArgs[0].maxOptionsReverse) {
          newArgs[0].maxOptions = newArgs[0].maxOptionsReverse;
        }
        newArgs[0].options.reverse();
      }

      if (super.show(newArgs)) {
        if (this.reverse) {
          this.processInput(Button.UP);
        }

        return true;
      }
    }
    return false;
  }

  protected setupOptions() {
    super.setupOptions();
    if (this.modalContainer) {
      // Adjust the width to the minimum of the visible options
      this.optionSelectContainer.setSize(this.optionSelectContainer.height, Math.max(this.optionSelectText.displayWidth, this.getWindowWidth()));
      if (this.reverse) {
        // Position above the input
        this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width + this.inputContainer.x, this.inputContainer.y);
        return;
      }
      // Position below the input
      this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width + this.inputContainer.x, this.optionSelectBg.height + this.inputContainer.y + (this.inputContainer.list.find((el) => el instanceof Phaser.GameObjects.NineSlice)?.height ?? 0));

      // If the modal goes off screen, center it
      // if ((this.optionSelectContainer.getBounds().width + this.optionSelectContainer.getBounds().x) > this.scene.game.canvas.width) {
      //   this.optionSelectContainer.setX((this.optionSelectContainer.x) - ((this.optionSelectContainer.width + this.optionSelectContainer.x) - (this.scene.game.canvas.width / 6)));
      // }
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

  handlerKeyDown (inputObject: InputText, evt: KeyboardEvent): void {
    // Don't move inputText cursor
    // TODO: cursor move fast for this
    if (["arrowup"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
      evt.preventDefault();
      this.processInput(Button.UP);
    } else if (["arrowdown"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
      evt.preventDefault();
      this.processInput(Button.DOWN);
    }

    // Revert Mode if not press...
    if (!["enter", "arrowup", "arrowdown", "shift", "control", "alt"].some((key) => (evt.code || evt.key).toLowerCase().includes(key))) {
      this.revertAutoCompleteMode();
    }

    // Recovery focus
    if (["escape"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
      const recoveryFocus = () => {
        inputObject.setFocus();
        inputObject.off("blur", recoveryFocus);
      };
      inputObject.on("blur", recoveryFocus);
    }
  }

  revertAutoCompleteMode(): void {
    const ui = this.scene.ui;
    if (ui.getMode() === Mode.AUTO_COMPLETE) {
      ui.revertMode();
    }
  }

  clear(): void {
    super.clear();
    const input = this.inputContainer.list.find((el) => el instanceof InputText);
    input?.off("keydown", this.handlerKeyDown);
    input?.off("blur", this.revertAutoCompleteMode);
    this.modalContainer.off("pointerdown", this.revertAutoCompleteMode);
  }
}
