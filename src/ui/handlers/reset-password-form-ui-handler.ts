import { pokerogueApi } from "#api/api";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#types/ui-types";
import i18next from "i18next";
import { FormModalUiHandler, type InputFieldConfig } from "./form-modal-ui-handler";

export class ResetPasswordFormUiHandler extends FormModalUiHandler {
  private readonly ERR_PASSWORD: string = "invalid password";
  private readonly ERR_USERNAME_RESET_CODE_MISMATCH: string = "username and reset code do not match";
  private readonly ERR_PASSWORD_MISMATCH: string = "password doesn't match";

  override getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:resetPassword");
  }

  override getWidth(_config?: ModalConfig): number {
    return 160;
  }

  override getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  override getButtonLabels(): string[] {
    return [i18next.t("settings:buttonSubmit"), i18next.t("menu:cancel")];
  }

  override getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
      case this.ERR_PASSWORD:
        return i18next.t("menu:invalidRegisterPassword");
      case this.ERR_USERNAME_RESET_CODE_MISMATCH:
        return i18next.t("menu:usernameResetCodeMismatch");
      case this.ERR_PASSWORD_MISMATCH:
        return i18next.t("menu:passwordNotMatchingConfirmPassword");
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push({
      label: i18next.t("menu:username"),
    });
    inputFieldConfigs.push({
      label: i18next.t("menu:resetCode"),
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
            return onFail(i18next.t("menu:emptyUsername"));
          }
          if (!resetCodeInput?.text) {
            return onFail(this.ERR_USERNAME_RESET_CODE_MISMATCH);
          }
          if (!passwordInput?.text) {
            return onFail(this.ERR_PASSWORD);
          }
          if (passwordInput.text !== confirmPasswordInput.text) {
            return onFail(this.ERR_PASSWORD_MISMATCH);
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
