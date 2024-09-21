import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { Mode } from "./ui";
import { OptionSelectConfigAC } from "./autocomplete-ui-handler";
import InputText from "phaser3-rex-plugins/plugins/inputtext";

export default class TestDialogueUiHandler extends FormModalUiHandler {

  keys: string[];

  constructor(scene, mode) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const flattenKeys = (object, topKey?: string, midleKey?: string[]): Array<any> => {
      return Object.keys(object).map((t, i) => {
        const value = Object.values(object)[i];

        if (typeof value === "object" && !isNullOrUndefined(value)) { // we check for not null or undefined here because if the language json file has a null key, the typeof will still be an object, but that object will be null, causing issues
          // If the value is an object, execute the same process

          return flattenKeys(value, topKey ?? t, topKey ? midleKey ? [...midleKey, t] : [t] : undefined).filter((t) => t.length > 0);
        } else if (typeof value === "string" || isNullOrUndefined(value)) { // we check for null or undefined here as per above - the typeof is still an object but the value is null so we need to exit out of this and pass the null key

          // Return in the format expected by i18next
          return midleKey ? `${topKey}:${midleKey.map((m) => m).join(".")}.${t}` : `${topKey}:${t}`;
        }
      }).filter((t) => t);
    };

    const keysInArrays = flattenKeys(i18next.getDataByLanguage(String(i18next.resolvedLanguage))).filter((t) => t.length > 0); // Array of arrays
    const keys = keysInArrays.flat(Infinity).map(String); // One array of string
    this.keys = keys;
  }

  getModalTitle(config?: ModalConfig): string {
    return "Test Dialogue";
  }

  getFields(config?: ModalConfig): string[] {
    return [ "Dialogue" ];
  }

  getWidth(config?: ModalConfig): number {
    return 300;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ "Check", "Cancel" ];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  show(args: any[]): boolean {
    const ui = this.getUi();
    const input = this.inputs[0];
    input.setMaxLength(255);

    input.on("textchange", (inputObject: InputText, evt: InputEvent) => {
      let options: OptionSelectItem[] = [];
      const splitArr = inputObject.text.split(" ");

      // At what index of splitArr is the input cursor located
      let indexInOriginalArray = 0;
      let cumulativeLength = 0;
      for (let i = 0; i < splitArr.length; i++) {
        const spaceAndWordLength = splitArr[i] === "" ? 2 : 1;
        cumulativeLength += (splitArr[i].length + spaceAndWordLength);
        if (cumulativeLength > input.cursorPosition) {
          indexInOriginalArray = i;
          break;
        }
      }

      const filteredKeys = this.keys.filter((command) => command.toLowerCase().includes(splitArr[indexInOriginalArray].toLowerCase()));
      if (inputObject.text !== "" && filteredKeys.length > 0) {
        options = filteredKeys.map((value) => {
          return {
            label: value,
            handler: () => {
              const separatedArray = inputObject.text.split(" ");
              separatedArray[indexInOriginalArray] = value;
              const cursorPosition = inputObject.cursorPosition - splitArr[indexInOriginalArray].length + separatedArray[indexInOriginalArray].length;
              inputObject.setText(separatedArray.join(" "));
              inputObject.setCursorPosition(cursorPosition);
              return true;
            }
          };
        });
      }

      if (options.length > 0) {
        const modalOpts: OptionSelectConfigAC = {
          options: options,
          maxOptions: 5,
          modalContainer: this.modalContainer,
          inputContainer: this.inputContainers[0]
        };
        ui.setOverlayMode(Mode.AUTO_COMPLETE, modalOpts);
      }

    });


    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      this.inputs[0].resize(1150, 116);
      this.inputContainers[0].list[0].width = 200;
      if (args[1] && typeof (args[1] as PlayerPokemon).getNameToRender === "function") {
        this.inputs[0].text = (args[1] as PlayerPokemon).getNameToRender();
      } else {
        this.inputs[0].text = args[1];
      }
      this.submitAction = (_) => {
        this.sanitizeInputs();
        const sanitizedName = btoa(unescape(encodeURIComponent(this.inputs[0].text)));
        config.buttonActions[0](sanitizedName);
        return true;
      };
      return true;
    }
    return false;
  }
}
