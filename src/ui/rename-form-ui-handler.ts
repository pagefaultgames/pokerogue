import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon.js";

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
    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      this.inputs[0].text = (args[1] as PlayerPokemon).getNameToRender();

      this.submitAction = (_) => {
        this.sanitizeInputs();
        // const onFail = () => {
        //   this.scene.ui.setModeWithoutClear(Mode.RENAME_POKEMON, Object.assign(config));
        //   this.scene.ui.playError();
        // };
        // if (!this.inputs[0].text) {
        //   return onFail();
        // }

        config.buttonActions[0](this.inputs[0].text);
        return true;
      };
      return true;
    }
    return false;
  }
}
