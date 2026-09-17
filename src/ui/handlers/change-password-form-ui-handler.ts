import { pokerogueApi } from "#api/api";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#types/ui-types";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import i18next from "i18next";

// TODO: Consider replacing server error strings with numeric error codes for better maintainability
// TODO: Centralize server error constants
const ERR_INVALID_PASSWORD = "invalid password";
const ERR_NO_ACCOUNT = "account doesn't exist";
const ERR_PASSWORD_MISMATCH = "password doesn't match";
const ERR_FAILED_TO_GENERATE_PASSWORD = "failed to generate salt";
const ERR_REMOVE_SESSIONS = "failed to remove sessions";
const ERR_ACCOUNT_UPDATE_FAILURE = "failed to add account record";

export class ChangePasswordFormUiHandler extends FormModalUiHandler {
  setup(): void {
    super.setup();
  }

  override getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:changePassword");
  }

  override getWidth(_config?: ModalConfig): number {
    return 160;
  }

  override getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  override getButtonLabels(_config?: ModalConfig): string[] {
    return [i18next.t("settings:buttonSubmit"), i18next.t("menu:cancel")];
  }

  override getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
      case ERR_INVALID_PASSWORD:
        return i18next.t("menu:invalidRegisterPassword");
      case ERR_NO_ACCOUNT:
        return i18next.t("menu:accountNonExistent");
      case ERR_PASSWORD_MISMATCH:
        return i18next.t("menu:passwordNotMatchingConfirmPassword");
      case ERR_FAILED_TO_GENERATE_PASSWORD:
        return `${i18next.t("menu:serverErrorGenerateSalt")}\n${i18next.t("menu:pleaseTryAgainLater")}`;
      case ERR_REMOVE_SESSIONS:
        return `${i18next.t("menu:serverErrorRemoveSessions")}\n${i18next.t("menu:pleaseTryAgainLater")}`;
      case ERR_ACCOUNT_UPDATE_FAILURE:
        return `${i18next.t("menu:serverErrorUpdateAccount")}\n${i18next.t("menu:pleaseTryAgainLater")}`;
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
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
            globalScene.ui.setMode(UiMode.CHANGE_PASSWORD_FORM, Object.assign(config, { errorMessage: error?.trim() }));
            globalScene.ui.playError();
          };
          const [passwordInput, confirmPasswordInput] = this.inputs;
          if (!passwordInput?.text) {
            return onFail(this.getReadableErrorMessage("invalid password"));
          }
          if (passwordInput.text !== confirmPasswordInput.text) {
            return onFail(ERR_PASSWORD_MISMATCH);
          }

          pokerogueApi.account.changePassword({ password: passwordInput.text }).then(error => {
            if (!error && originalSubmitAction) {
              globalScene.ui.playSelect();
              originalSubmitAction();
              // Only clear inputs if the action was successful
              for (const input of this.inputs) {
                input.setText("");
              }
            } else {
              onFail(error);
            }
          });
        }
      };
      // Upon pressing cancel, the inputs should be cleared
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

  override clear() {
    super.clear();
    this.setMouseCursorStyle("default"); //reset cursor
  }
}
