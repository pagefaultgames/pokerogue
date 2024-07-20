import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import i18next from "i18next";
import * as LoggerTools from "../logger";
import { addTextObject, TextStyle } from "./text";

export default class LogNameFormUiHandler extends FormModalUiHandler {
  name: string;

  getModalTitle(config?: ModalConfig): string {
    return (this.name ? this.name : "Manage Log");
  }

  getFields(config?: ModalConfig): string[] {
    return [ "Name", "Author(s)", "Label" ];
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

    //const label = addTextObject(this.scene, 10, 87, "Clicking Export or ExSheets does NOT save any text you entered\nPress \"Rename\", then reopen this menu and click Export", TextStyle.TOOLTIP_CONTENT, { fontSize: "42px" });
    //this.modalContainer.add(label);

    this.inputs[0].maxLength = 99
    this.inputs[1].maxLength = 200
  }

  show(args: any[]): boolean {
    this.name = args[0].autofillfields[0]
    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      console.log("Shown", args)

      const originalLoginAction = this.submitAction;
      this.inputs[0].setText(args[0].autofillfields[0])
      this.inputs[1].setText(args[0].autofillfields[1])
      this.inputs[2].setText(args[0].autofillfields[2])
      this.submitAction = (_) => {
        console.log("submitAction")
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
        console.log(`Calling LoggerTools.setFileInfo(${this.inputs[0].text}, ${this.inputs[1].text.split(",")})`)
        LoggerTools.setFileInfo(this.inputs[0].text, this.inputs[1].text.split(","))
        console.log(`Calling originalLoginAction()`)
        originalLoginAction()
      };
      const exportaction1 = config.buttonActions[1]
      config.buttonActions[1] = (_) => {
        LoggerTools.setFileInfo(this.inputs[0].text, this.inputs[1].text.split(","))
        exportaction1()
      }
      const exportaction2 = config.buttonActions[2]
      config.buttonActions[2] = (_) => {
        LoggerTools.setFileInfo(this.inputs[0].text, this.inputs[1].text.split(","))
        exportaction2()
      }

      return true;
    }

    return false;
  }
}
