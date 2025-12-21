import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import i18next from "i18next";
import { LoginRegisterInfoContainerUiHandler } from "./login-register-info-container-ui-handler";

export class RegistrationFormUiHandler extends LoginRegisterInfoContainerUiHandler {
  public override getModalTitle(): string {
    return i18next.t("menu:register");
  }

  public override getWidth(): number {
    return 160;
  }

  public override getMargin(): [number, number, number, number] {
    return [0, 20, 48, 0];
  }

  public override getButtonTopMargin(): number {
    return 12;
  }

  public override getButtonLabels(): string[] {
    return [i18next.t("menu:register"), i18next.t("menu:goBack")];
  }

  public override getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
      case "invalid username":
        return i18next.t("menu:invalidRegisterUsername");
      case "invalid password":
        return i18next.t("menu:invalidRegisterPassword");
      case "failed to add account record":
        return i18next.t("menu:usernameAlreadyUsed");
    }

    return super.getReadableErrorMessage(error);
  }

  public override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push({ label: i18next.t("menu:username") });
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

  public override setup(): void {
    super.setup();

    const label = addTextObject(10, 87, i18next.t("menu:registrationAgeWarning"), TextStyle.TOOLTIP_CONTENT, {
      fontSize: "42px",
      wordWrap: { width: 850 },
    });

    this.modalContainer.add(label);
  }

  public override show(args: [ModalConfig, ...any[]]): boolean {
    if (!super.show(args)) {
      return false;
    }

    const config = args[0];
    this.showInfoContainer(config);

    const originalRegistrationAction = this.submitAction;
    this.submitAction = () => {
      if (globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalRegistrationAction;
        this.sanitizeInputs();
        globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
        const onFail = error => {
          globalScene.ui.setMode(UiMode.REGISTRATION_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          globalScene.ui.playError();
        };
        if (!this.inputs[0].text) {
          return onFail(i18next.t("menu:emptyUsername"));
        }
        if (!this.inputs[1].text) {
          return onFail(this.getReadableErrorMessage("invalid password"));
        }
        if (this.inputs[1].text !== this.inputs[2].text) {
          return onFail(i18next.t("menu:passwordNotMatchingConfirmPassword"));
        }
        const [usernameInput, passwordInput] = this.inputs;
        pokerogueApi.account
          .register({
            username: usernameInput.text,
            password: passwordInput.text,
          })
          .then(registerError => {
            if (registerError) {
              onFail(registerError);
            } else {
              pokerogueApi.account
                .login({
                  username: usernameInput.text,
                  password: passwordInput.text,
                })
                .then(loginError => {
                  if (loginError) {
                    onFail(loginError);
                  } else {
                    originalRegistrationAction?.();
                  }
                });
            }
          });
      }
    };

    return true;
  }
}
