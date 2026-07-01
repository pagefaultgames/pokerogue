import { Pokemon } from "#field/pokemon";
import type { FormModalConfig, InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import i18next from "i18next";

type RenameFormConfig = [FormModalConfig, Pokemon | string];

export class RenameFormUiHandler extends FormModalUiHandler<RenameFormConfig> {
  getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:renamePokemon");
  }

  getWidth(_config?: ModalConfig): number {
    return 160;
  }

  getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(_config?: ModalConfig): string[] {
    return [i18next.t("menu:rename"), i18next.t("menu:cancel")];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    return [{ label: i18next.t("menu:nickname") }];
  }

  show(args: RenameFormConfig): boolean {
    if (super.show(args)) {
      const config = args[0];

      if (args[1] instanceof Pokemon) {
        this.inputs[0].text = args[1].getNameToRender();
      } else {
        this.inputs[0].text = args[1];
      }

      this.submitAction = () => {
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
