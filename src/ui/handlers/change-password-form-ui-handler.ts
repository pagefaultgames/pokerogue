import { globalScene } from "#app/global-scene";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { UiMode } from "#enums/ui-mode";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import i18next from "i18next";

const ERR_PASSWORD: string = "invalid password";
const ERR_ACCOUNT_EXIST: string = "account doesn't exist";
const ERR_PASSWORD_MISMATCH: string = "password doesn't match";
const ERR_GENERATE_SALT: string = "failed to generate salt";
const ERR_REMOVE_SESSIONS: string = "failed to remove sessions";
const ERR_ADD_RECORD: string = "failed to add account record";

export class ChangePasswordFormUiHandler extends FormModalUiHandler {
  constructor(mode: UiMode | null = null) {
    super(mode);
  }

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
      case ERR_PASSWORD:
        return i18next.t("menu:invalidRegisterPassword");
      case ERR_ACCOUNT_EXIST:
        return i18next.t("menu:accountNonExistent");
      case ERR_PASSWORD_MISMATCH:
        return i18next.t("menu:passwordNotMatchingConfirmPassword");
      case ERR_GENERATE_SALT:
        return i18next.t("menu:serverErrorGenerateSalt");
      case ERR_REMOVE_SESSIONS:
        return i18next.t("menu:serverErrorRemoveSessions");
      case ERR_ADD_RECORD:
        return i18next.t("menu:serverErrorUpdateAccount");
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
