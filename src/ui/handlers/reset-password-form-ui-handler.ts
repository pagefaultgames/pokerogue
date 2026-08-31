import { pokerogueApi } from "#api/api";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#types/ui-types";
import i18next from "i18next";
import { FormModalUiHandler, type InputFieldConfig } from "./form-modal-ui-handler";

export class ResetPasswordFormUiHandler extends FormModalUiHandler {
  override getModalTitle(_config?: ModalConfig): string {
    return "Reset Password";
  }

  override getWidth(_config?: ModalConfig): number {
    return 160;
  }

  override getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  override getButtonLabels(): string[] {
    return ["Submit", "Cancel"];
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push({
      label: "Username",
    });
    inputFieldConfigs.push({
      label: "Reset code",
      isPassword: true,
    });
    inputFieldConfigs.push({
      label: i18next.t("menu:password"),
      isPassword: true,
    });
    inputFieldConfigs.push({
      label: i18next.t("menu:confirmPassword"),
      isPassword: true,
    });
    return inputFieldConfigs;
  }

  override show(args: [ModalConfig, ...any]): boolean {
    if (super.show(args)) {
      const config = args[0];
      const originalSubmitAction = this.submitAction;
      this.submitAction = () => {
        if (globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
          // Prevent overlapping overrides on action modification
          this.submitAction = originalSubmitAction;
          this.sanitizeInputs();
          globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
          const onFail = (error: string | null) => {
            globalScene.ui.setMode(UiMode.RESET_PASSWORD_FORM, Object.assign(config, { errorMessage: error?.trim() }));
            globalScene.ui.playError();
          };
          const [usernameInput, resetCodeInput, passwordInput, confirmPasswordInput] = this.inputs;
          if (!usernameInput?.text) {
            return onFail("Username cannot be empty");
          }
          if (!resetCodeInput?.text) {
            return onFail("Reset code cannot be empty");
          }
          if (!passwordInput?.text) {
            return onFail("Password cannot be empty");
          }
          if (passwordInput.text !== confirmPasswordInput.text) {
            return onFail("Passwords do not match");
          }

          pokerogueApi.account
            .resetPassword({
              username: usernameInput.text,
              resetCode: resetCodeInput.text,
              password: passwordInput.text,
            })
            .then(error => {
              if (!error && originalSubmitAction) {
                globalScene.ui.playSelect();
                originalSubmitAction();
                for (const input of this.inputs) {
                  input.setText("");
                }
              } else {
                onFail(error);
              }
            });
        }
      };

      const originalCancelAction = this.cancelAction;
      this.cancelAction = () => {
        globalScene.ui.playSelect();
        for (const input of this.inputs) {
          input.setText("");
        }
        originalCancelAction?.();
      };
      return true;
    }

    return false;
  }
}
