import type { InputFieldConfig } from "./form-modal-ui-handler";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import type { ModalConfig } from "./modal-ui-handler";
import type { PlayerPokemon } from "#app/field/pokemon";
import type { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { Mode } from "./ui";
import { FilterTextRow } from "./filter-text";
import { allAbilities } from "#app/data/ability";
import { allMoves } from "#app/data/move";
import { allSpecies } from "#app/data/pokemon-species";
import i18next from "i18next";

export default class PokedexScanUiHandler extends FormModalUiHandler {

  keys: string[];
  reducedKeys: string[];
  parallelKeys: string[];
  nameKeys: string[];
  moveKeys: string[];
  abilityKeys: string[];
  row: number;

  constructor(mode) {
    super(mode);
  }

  setup() {
    super.setup();

    this.nameKeys = allSpecies.map(a => a.name).filter((value, index, self) => self.indexOf(value) === index);
    this.moveKeys = allMoves.map(a => a.name);
    this.abilityKeys = allAbilities.map(a => a.name);
  }

  getModalTitle(config?: ModalConfig): string {
    return i18next.t("pokedexUiHandler:scanChooseOption");
  }

  getWidth(config?: ModalConfig): number {
    return 300;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ i18next.t("pokedexUiHandler:scanSelect"), i18next.t("pokedexUiHandler:scanCancel") ];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    switch (this.row) {
      case FilterTextRow.NAME: {
        return [{ label: i18next.t("pokedexUiHandler:scanLabelName") }];
      }
      case FilterTextRow.MOVE_1:
      case FilterTextRow.MOVE_2: {
        return [{ label: i18next.t("pokedexUiHandler:scanLabelMove") }];
      }
      case FilterTextRow.ABILITY_1:{
        return [{ label: i18next.t("pokedexUiHandler:scanLabelAbility") }];
      }
      case FilterTextRow.ABILITY_2: {
        return [{ label: i18next.t("pokedexUiHandler:scanLabelPassive") }];
      }
      default: {
        return [{ label: "" }];
      }
    }

  }

  reduceKeys(): void {
    switch (this.row) {
      case FilterTextRow.NAME: {
        this.reducedKeys = this.nameKeys;
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
  }


  // args[2] is an index of FilterTextRow
  show(args: any[]): boolean {
    this.row = args[2];
    const ui = this.getUi();
    const hasTitle = !!this.getModalTitle();
    this.updateFields(this.getInputFieldConfigs(), hasTitle);
    this.updateContainer(args[0] as ModalConfig);
    const input = this.inputs[0];
    input.setMaxLength(255);

    this.reduceKeys();

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
      const filteredKeys = this.reducedKeys.filter((command) => command.toLowerCase().includes(inputObject.text.toLowerCase()));
      if (inputObject.text !== "" && filteredKeys.length > 0) {
        options = filteredKeys.slice(0).map((value) => {
          return {
            label: value,
            handler: () => {
              if (!isNullOrUndefined(evt.data) || evt.inputType?.toLowerCase() === "deletecontentbackward") {
                inputObject.setText(value);
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

  clear(): void {
    super.clear();

    // Clearing the labels so they don't appear again and overlap
    this.formLabels.forEach(label => {
      label.destroy();
    });
  }
}
