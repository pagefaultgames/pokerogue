import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import i18next from "i18next";
import * as LoggerTools from "../logger";
import { addTextObject, TextStyle } from "./text";

export default class LogNameFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return "New Log";
  }

  getFields(config?: ModalConfig): string[] {
    return [ "Name", "Author(s)" ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ "Rename", "Export", "ExSheet", "Delete" ];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
    case "invalid username":
      return i18next.t("menu:invalidLoginUsername");
    case "invalid password":
      return i18next.t("menu:invalidLoginPassword");
    case "account doesn't exist":
      return i18next.t("menu:accountNonExistent");
    case "password doesn't match":
      return i18next.t("menu:unmatchingPassword");
    }

    return super.getReadableErrorMessage(error);
  }

  setup(): void {
    super.setup();

    //const label = addTextObject(this.scene, 10, 87, "Text", TextStyle.TOOLTIP_CONTENT, { fontSize: "42px" });

    //this.modalContainer.add(label);

    this.inputs[0].maxLength = 99
    this.inputs[1].maxLength = 200
  }

  show(args: any[]): boolean {
    console.error("Shown")
    if (super.show(args)) {
      const config = args[0] as ModalConfig;

      const originalLoginAction = this.submitAction;
      this.inputs[0].setText(args[0].autofillfields[0])
      this.inputs[1].setText(args[0].autofillfields[1])
      this.submitAction = (_) => {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalLoginAction;
        this.sanitizeInputs();
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          this.scene.ui.setMode(Mode.NAME_LOG, Object.assign(config, { errorMessage: error?.trim() }));
          this.scene.ui.playError();
        };
        if (!this.inputs[0].text) {
          //return onFail(i18next.t("menu:emptyUsername"));
        }
        LoggerTools.setFileInfo(this.inputs[0].text, this.inputs[1].text.split(","))
        originalLoginAction()
      };

      return true;
    }

    return false;
  }
}
