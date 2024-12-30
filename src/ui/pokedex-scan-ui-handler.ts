import { FormModalUiHandler, InputFieldConfig } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { Mode } from "./ui";
import { FilterTextRow } from "./filter-text";
import { allAbilities } from "#app/data/ability";
import { allMoves } from "#app/data/move";

export default class PokedexScanUiHandler extends FormModalUiHandler {

  keys: string[];
  reducedKeys: string[];
  parallelKeys: string[];
  moveKeys: string[];
  abilityKeys: string[];

  constructor(scene, mode) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const flattenKeys = (object?: any, topKey?: string, midleKey?: string[]): Array<any> => {
      return Object.keys(object ?? {}).map((t, i) => {
        const value = Object.values(object)[i];

        if (typeof value === "object" && !isNullOrUndefined(value)) { // we check for not null or undefined here because if the language json file has a null key, the typeof will still be an object, but that object will be null, causing issues
          // If the value is an object, execute the same process
          // si el valor es un objeto ejecuta el mismo proceso

          return flattenKeys(value, topKey ?? t, topKey ? midleKey ? [ ...midleKey, t ] : [ t ] : undefined).filter((t) => t.length > 0);
        } else if (typeof value === "string" || isNullOrUndefined(value)) { // we check for null or undefined here as per above - the typeof is still an object but the value is null so we need to exit out of this and pass the null key

          // Return in the format expected by i18next
          return midleKey ? `${topKey}:${midleKey.map((m) => m).join(".")}.${t}` : `${topKey}:${t}`;
        }
      }).filter((t) => t);
    };

    const keysInArrays = flattenKeys(i18next.getDataByLanguage(String(i18next.resolvedLanguage))).filter((t) => t.length > 0); // Array of arrays
    const keys = keysInArrays.flat(Infinity).map(String); // One array of string

    this.moveKeys = allMoves.map(a => a.name);
    this.abilityKeys = allAbilities.map(a => a.name);

    this.keys = keys;
  }

  getModalTitle(config?: ModalConfig): string {
    return "Choose option";
  }

  getWidth(config?: ModalConfig): number {
    return 300;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ "Select", "Cancel" ];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    return [{ label: "Dialogue" }];
  }

  reduceKeys(row: FilterTextRow): void {
    console.log("Function was called!");
    console.log(this.keys);
    switch (row) {
      case FilterTextRow.NAME: {
        const startString = "pokemon:";
        // TODO: nameKeys
        this.reducedKeys = this.keys.filter(str => str.startsWith(startString));
        break;
      }
      case FilterTextRow.MOVE_1:
      case FilterTextRow.MOVE_2: {
        this.reducedKeys = this.moveKeys;
        break;
      }
      case FilterTextRow.ABILITY_1:
      case FilterTextRow.ABILITY_2: {
        this.reducedKeys = this.abilityKeys;
        break;
      }
      default: {
        this.reducedKeys = this.keys;
      }
    }
    console.log(this.reducedKeys);

    //    this.parallelKeys = this.reducedKeys.map(key => this.translateKey(key));
    this.parallelKeys = this.reducedKeys.map(key => String(i18next.t(key)));

    console.log(this.parallelKeys);
  }

  translateKey(key: string): string {
    const interpolatorOptions: any = {};
    const splitArr = key.split(" "); // this splits our inputted text into words to cycle through later
    const translatedString = splitArr[0]; // this is our outputted i18 string
    const regex = RegExp("\\{\\{(\\w*)\\}\\}", "g"); // this is a regex expression to find all the text between {{ }} in the i18 output
    const matches = i18next.t(translatedString).match(regex) ?? [];
    if (matches.length > 0) {
      for (let match = 0; match < matches.length; match++) {
        // we add 1 here  because splitArr[0] is our first value for the translatedString, and after that is where the variables are
        // the regex here in the replace (/\W/g) is to remove the {{ and }} and just give us all alphanumeric characters
        if (typeof splitArr[match + 1] !== "undefined") {
          interpolatorOptions[matches[match].replace(/\W/g, "")] = i18next.t(splitArr[match + 1]);
        }
      }
    }

    return String(i18next.t(translatedString, interpolatorOptions));
  }

  // args[2] is an index of FilterTextRow
  show(args: any[]): boolean {
    const ui = this.getUi();
    const hasTitle = !!this.getModalTitle();
    this.updateFields(this.getInputFieldConfigs(), hasTitle);
    this.updateContainer(args[0] as ModalConfig);
    const input = this.inputs[0];
    input.setMaxLength(255);

    console.log(args[2]);
    this.reduceKeys(args[2]);

    input.on("keydown", (inputObject, evt: KeyboardEvent) => {
      if ([ "escape", "space" ].some((v) => v === evt.key.toLowerCase() || v === evt.code.toLowerCase()) && ui.getMode() === Mode.AUTO_COMPLETE) {
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
      const filteredKeys = this.parallelKeys.filter((command) => command.toLowerCase().includes(splitArr[splitArr.length - 1].toLowerCase()));
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
        if (ui.getMode() === Mode.POKEDEX_SCAN) {
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
