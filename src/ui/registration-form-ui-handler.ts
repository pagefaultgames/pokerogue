import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import { TextStyle, addTextObject } from "./text";
import i18next from '../plugins/i18n';

export default class RegistrationFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return i18next.t('menu:register');
  }

  getFields(config?: ModalConfig): string[] {
    return [ i18next.t('menu:username'), i18next.t('menu:password'), i18next.t('menu:confirmPassword') ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonTopMargin(): number {
    return 8;
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ i18next.t('menu:register'), i18next.t('menu:backToLogin') ];
  }

  getReadableErrorMessage(error: string): string {
    let colonIndex = error?.indexOf(':');
    if (colonIndex > 0)
      error = error.slice(0, colonIndex);
    switch (error) {
      case 'invalid username':
        return i18next.t('menu:invalidRegisterUsername');
      case 'invalid password':
        return i18next.t('menu:invalidRegisterPassword');
      case 'failed to add account record':
        return i18next.t('menu:usernameAlreadyUsed');
    }

    return super.getReadableErrorMessage(error);
  }

  setup(): void {
    super.setup();

    const label = addTextObject(this.scene, 10, 87, i18next.t('menu:registrationAgeWarning'), TextStyle.TOOLTIP_CONTENT, { fontSize: '42px' });

    this.modalContainer.add(label);
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      const config = args[0] as ModalConfig;

      const originalRegistrationAction = this.submitAction;
      this.submitAction = (_) => {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalRegistrationAction;
        this.sanitizeInputs();
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          this.scene.ui.setMode(Mode.REGISTRATION_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          this.scene.ui.playError();
        };
        if (!this.inputs[0].text)
          return onFail(i18next.t('menu:emptyUsername'));
        if (!this.inputs[1].text)
          return onFail(this.getReadableErrorMessage('invalid password'));
        if (this.inputs[1].text !== this.inputs[2].text)
          return onFail(i18next.t('menu:passwordNotMatchingConfirmPassword'));
        Utils.apiPost(`account/register`, `username=${encodeURIComponent(this.inputs[0].text)}&password=${encodeURIComponent(this.inputs[1].text)}`, 'application/x-www-form-urlencoded')
          .then(response => response.text())
          .then(response => {
            if (!response) {
              Utils.apiPost(`account/login`, `username=${encodeURIComponent(this.inputs[0].text)}&password=${encodeURIComponent(this.inputs[1].text)}`, 'application/x-www-form-urlencoded')
                .then(response => {
                  if (!response.ok)
                    return response.text();
                  return response.json();
                })
                .then(response => {
                  if (response.hasOwnProperty('token')) {
                    Utils.setCookie(Utils.sessionIdKey, response.token);
                    originalRegistrationAction();
                  } else
                    onFail(response);
                });
            } else
              onFail(response);
          });
      };

      return true;
    }

    return false;
  }
}