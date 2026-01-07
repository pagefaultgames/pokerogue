import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { OAuthProvidersUiHandler } from "#ui/oauth-providers-ui-handler";
import i18next from "i18next";

const ERR_USERNAME: string = "invalid username";
const ERR_PASSWORD: string = "invalid password";
const ERR_ACCOUNT_EXIST: string = "account doesn't exist";
const ERR_PASSWORD_MATCH: string = "password doesn't match";

export class LoginFormUiHandler extends OAuthProvidersUiHandler {
  constructor(mode: UiMode | null = null) {
    super(mode);
  }

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

    switch (error) {
      case ERR_USERNAME:
        return i18next.t("menu:invalidLoginUsername");
      case ERR_PASSWORD:
        return i18next.t("menu:invalidLoginPassword");
      case ERR_ACCOUNT_EXIST:
        return i18next.t("menu:accountNonExistent");
      case ERR_PASSWORD_MATCH:
        return i18next.t("menu:unmatchingPassword");
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
