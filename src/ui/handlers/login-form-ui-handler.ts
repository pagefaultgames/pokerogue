import { pokerogueApi } from "#api/api";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#types/ui-types";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { OAuthProvidersUiHandler } from "#ui/oauth-providers-ui-handler";
import i18next from "i18next";

// TODO: Consider replacing server error strings with numeric error codes for better maintainability
// TODO: Centralize server error constants
const ERR_INVALID_USERNAME = "invalid username";
const ERR_INVALID_PASSWORD = "invalid password";
const ERR_NO_ACCOUNT = "account doesn't exist";
const ERR_PASSWORD_MISMATCH = "password doesn't match";
const ERR_FAILED_TO_GENERATE_TOKEN = "failed to generate token";
const ERR_FAILED_TO_ADD_SESSION = "failed to add account session";

export class LoginFormUiHandler extends OAuthProvidersUiHandler {
  public override getModalTitle(): string {
    if (import.meta.env.VITE_SERVER_URL === "https://apibeta.pokerogue.net") {
      return i18next.t("menu:loginBeta");
    }
    return i18next.t("menu:login");
  }

  public override getWidth(): number {
    return 160;
  }

  public override getMargin(): [number, number, number, number] {
    return [0, 20, 48, 0];
  }

  public override getButtonLabels(): string[] {
    return [i18next.t("menu:login"), i18next.t("menu:goBack")];
  }

  public override getReadableErrorMessage(error: string): string {
    if (!error) {
      return "";
    }

    const colonIndex = error.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    switch (error) {
      case ERR_INVALID_USERNAME:
        return i18next.t("menu:invalidLoginUsername");
      case ERR_INVALID_PASSWORD:
        return i18next.t("menu:invalidLoginPassword");
      case ERR_NO_ACCOUNT:
        return i18next.t("menu:accountNonExistent");
      case ERR_PASSWORD_MISMATCH:
        return i18next.t("menu:unmatchingPassword");
      case ERR_FAILED_TO_GENERATE_TOKEN:
        return `${i18next.t("menu:serverErrorGenerateToken")}\n${i18next.t("menu:pleaseTryAgainLater")}`;
      case ERR_FAILED_TO_ADD_SESSION:
        return `${i18next.t("menu:serverErrorAddSession")}\n${i18next.t("menu:pleaseTryAgainLater")}`;
    }

    return super.getReadableErrorMessage(error);
  }

  public override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push(
      { label: i18next.t("menu:username") },
      {
        label: i18next.t("menu:password"),
        isPassword: true,
      },
    );
    return inputFieldConfigs;
  }

  public override show(args: any[]): boolean {
    if (!super.show(args)) {
      return false;
    }
    const config = args[0] as ModalConfig;
    this.processExternalProvider();
    this.showInfoContainer(config);
    const originalLoginAction = this.submitAction;
    this.submitAction = () => {
      if (globalScene.tweens.getTweensOf(this.modalContainer).length > 0) {
        return;
      }
      // Prevent overlapping overrides on action modification
      this.submitAction = originalLoginAction;
      this.sanitizeInputs();
      globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
      const onFail = (error: string | null) => {
        globalScene.ui.setMode(UiMode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
        globalScene.ui.playError();
      };
      if (!this.inputs[0].text) {
        return onFail(i18next.t("menu:emptyUsername"));
      }

      const [usernameInput, passwordInput] = this.inputs;

      pokerogueApi.account
        .login({
          username: usernameInput.text,
          password: passwordInput.text,
        })
        .then(error => {
          if (!error && originalLoginAction) {
            originalLoginAction();
          } else {
            onFail(error);
          }
        });
    };

    return true;
  }
}
