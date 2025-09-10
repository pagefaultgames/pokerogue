import i18next from "i18next";
import { FormModalUiHandler, type InputFieldConfig } from "./form-modal-ui-handler";
import type { ModalConfig } from "./modal-ui-handler";

export class RenameRunFormUiHandler extends FormModalUiHandler {
  getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:renameRun");
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
    return [{ label: i18next.t("menu:runName") }];
  }

  show(args: any[]): boolean {
    if (!super.show(args)) {
      return false;
    }
    if (this.inputs?.length > 0) {
      this.inputs.forEach(input => {
        input.text = "";
      });
    }
    const config = args[0] as ModalConfig;
    this.submitAction = _ => {
      this.sanitizeInputs();
      const sanitizedName = btoa(encodeURIComponent(this.inputs[0].text));
      config.buttonActions[0](sanitizedName);
      return true;
    };
    return true;
  }
}
