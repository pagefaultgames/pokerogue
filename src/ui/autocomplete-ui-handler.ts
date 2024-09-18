import { Button } from "#enums/buttons";
import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler, { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";
import InputText from "phaser3-rex-plugins/plugins/inputtext";

export interface OptionSelectConfigAC extends OptionSelectConfig {
  inputContainer: Phaser.GameObjects.Container;
  modalContainer: Phaser.GameObjects.Container;
  maxOptionsReverse?: number;
  reverse?: true;
}

export default class AutoCompleteUiHandler extends AbstractOptionSelectUiHandler {
  modalContainer: Phaser.GameObjects.Container;
  inputContainer: Phaser.GameObjects.Container;
  handlerKeyDown: (inputObject: InputText, evt: KeyboardEvent) => void;
  reverse?: true;

  constructor(scene: BattleScene, mode: Mode = Mode.AUTO_COMPLETE) {
    super(scene, mode);

    this.handlerKeyDown = (inputObject, evt) => {
      // Don't move inputText cursor
      if (["arrowup"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
        evt.preventDefault();
        this.processInput(Button.UP);
      } else if (["arrowdown"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
        evt.preventDefault();
        this.processInput(Button.DOWN);
      }

      // Revert Mode when not press...
      if (!["enter", "arrowup", "arrowdown"].some((key) => (evt.code || evt.key).toLowerCase().includes(key))) {
        this.scene.ui.revertMode();
      }

      // Recovery focus
      if (["escape"].some((key) => key === (evt.code || evt.key).toLowerCase())) {
        const recoveryFocus = () => (inputObject.setFocus(), inputObject.off("blur", recoveryFocus));
        inputObject.on("blur", recoveryFocus);
      }
    };

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
            ui.revertMode();
            return true;
          }
          return false;
        };
      });
      this.modalContainer = modalContainer;
      this.inputContainer = inputContainer;
      const input = args[0].inputContainer.list.find((el) => el instanceof InputText);
      const ui = this.getUi();

      const originalsEvents = input.listeners("keydown");
      for (let i = 0; i < originalsEvents?.length; i++) {
        input.off("keydown", originalsEvents[i]);
      }

      const handlerBlur = () => {
        ui.revertMode();
        input.off("blur", handlerBlur);
      };
      const handlerPointerUp = () => {
        ui.revertMode();
        this.modalContainer.off("pointerup", handlerPointerUp);
      };

      input.on("blur", handlerBlur);
      input.on("keydown", this.handlerKeyDown);
      this.modalContainer.on("pointerup", handlerPointerUp);

      for (let i = 0; i < originalsEvents?.length; i++) {
        input.on("keydown", originalsEvents[i]);
      }

      if (this.reverse && newArgs[0].maxOptionsReverse) {
        newArgs[0].maxOptions = newArgs[0].maxOptionsReverse;
      }

      if (this.reverse) {
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
      if (this.reverse) {
        this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width + this.inputContainer.x, this.inputContainer.y);
        return;
      }
      this.optionSelectContainer.setPositionRelative(this.modalContainer, this.optionSelectBg.width + this.inputContainer.x, this.optionSelectBg.height + this.inputContainer.y + (this.inputContainer.list.find((el) => el instanceof Phaser.GameObjects.NineSlice)?.height ?? 0));
    }
  }

  clear(): void {
    super.clear();
    const input = this.inputContainer.list.find((el) => el instanceof InputText);
    input?.off("keydown", this.handlerKeyDown);
  }
}
