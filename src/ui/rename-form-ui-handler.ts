import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { Mode } from "./ui";
import { OptionSelectConfig, OptionSelectItem } from "./abstact-option-select-ui-handler";

const emojiAvailable = ["♪", "★", "♥", "♣"];

export default class RenameFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return i18next.t("menu:renamePokemon");
  }

  getFields(config?: ModalConfig): string[] {
    return [ i18next.t("menu:nickname") ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ i18next.t("menu:rename"), i18next.t("menu:cancel") ];
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
    input.node.addEventListener("keydown",(e:KeyboardEvent)=>{
      if (e.key === "/") {
        const emojiOptions = emojiAvailable.map((emoji): OptionSelectItem => {
          return {
            label: emoji,
            handler: ()=> {
              ui.revertMode();
              return true;
            },
            keepOpen: true
          };
        });
        const modalOptions: OptionSelectConfig = {
          xOffset: 98,
          yOffset: 48 / 2,
          options: emojiOptions
        };
        this.scene.ui.setOverlayMode(Mode.MENU_OPTION_SELECT, modalOptions);
        // input.setText(input.text + emojiAvailable[0]);
      } else if (input.cursorPosition === (input.text.split("").findIndex((value) => value === "/"))) {
        // input.setData("filter", )
        console.log(input.text[input.text.split("").findIndex((value) => value === "/")]);
      } else if (e.code === "Escape" && ui.getMode() === Mode.MENU_OPTION_SELECT) {
        e.preventDefault();
        ui.revertMode();
        console.log(e, input);
      }
    });
    if (super.show(args)) {
      const config = args[0] as ModalConfig;
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
