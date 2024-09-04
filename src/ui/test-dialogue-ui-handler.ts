import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { Mode } from "./ui";

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
          // si el valor es un objeto ejecuta el mismo proceso

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

    input.on("keydown", (inputObject, evt: KeyboardEvent) => {
      if (["escape", "space"].some((v) => v === evt.key.toLowerCase() || v === evt.code.toLowerCase()) && ui.getMode() === Mode.AUTO_COMPLETE) {
        // Delete autocomplete list and recovery focus.
        inputObject.on("blur", () => inputObject.node.focus(), { once: true });
        ui.revertMode();
      }
    });

    input.on("textchange", (inputObject, evt: InputEvent) => {
      // Delete autocomplete.
      if (ui.getMode() === Mode.AUTO_COMPLETE) {
        ui.revertMode();
      }

      let options: OptionSelectItem[] = [];
      const splitArr = inputObject.text.split(" ");
      const filteredKeys = this.keys.filter((command) => command.toLowerCase().includes(splitArr[splitArr.length - 1].toLowerCase()));
      if (inputObject.text !== "" && filteredKeys.length > 0) {
        // if performance is required, you could reduce the number of total results by changing the slice below to not have all ~8000 inputs going
        options = filteredKeys.slice(0).map((value) => {
          return {
            label: value,
            handler: () => {
              // this is here to make sure that if you try to backspace then enter, the last known evt.data (backspace) is picked up
              // this is because evt.data is null for backspace, so without this, the autocomplete windows just closes
              if (!isNullOrUndefined(evt.data) || evt.inputType?.toLowerCase() === "deletecontentbackward") {
                const separatedArray = inputObject.text.split(" ");
                separatedArray[separatedArray.length - 1] = value;
                inputObject.setText(separatedArray.join(" "));
              }
              ui.revertMode();
              return true;
            }
          };
        });
      }

      if (options.length > 0) {
        const modalOpts = {
          options: options,
          maxOptions: 5,
          modalContainer: this.modalContainer
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
        if (ui.getMode() === Mode.TEST_DIALOGUE) {
          this.sanitizeInputs();
          const sanitizedName = btoa(unescape(encodeURIComponent(this.inputs[0].text)));
          config.buttonActions[0](sanitizedName);
          return true;
        }
        return false;
      };
      return true;
    }
    return false;
  }
}
