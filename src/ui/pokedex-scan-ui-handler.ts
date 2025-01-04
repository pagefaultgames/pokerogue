import { FormModalUiHandler, InputFieldConfig } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import { PlayerPokemon } from "#app/field/pokemon";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { Mode } from "./ui";
import { FilterTextRow } from "./filter-text";
import { allAbilities } from "#app/data/ability";
import { allMoves } from "#app/data/move";
import { allSpecies } from "#app/data/pokemon-species";

export default class PokedexScanUiHandler extends FormModalUiHandler {

  keys: string[];
  reducedKeys: string[];
  parallelKeys: string[];
  nameKeys: string[];
  moveKeys: string[];
  abilityKeys: string[];

  constructor(scene, mode) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    this.nameKeys = allSpecies.map(a => a.name).filter((value, index, self) => self.indexOf(value) === index);
    this.moveKeys = allMoves.map(a => a.name);
    this.abilityKeys = allAbilities.map(a => a.name);
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
  //TODO: This logic is probably way more complex than we need, and actually messes things up for moves and abilities with a space like "Leech Seed"
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
}
