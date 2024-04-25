import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import i18next from '../plugins/i18n';

export default class LoginFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return i18next.t('menu:login');
  }

  getFields(config?: ModalConfig): string[] {
    return [ i18next.t('menu:username'), i18next.t('menu:password') ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ i18next.t('menu:login'), i18next.t('menu:register') ];
  }

  getReadableErrorMessage(error: string): string {
    let colonIndex = error?.indexOf(':');
    if (colonIndex > 0)
      error = error.slice(0, colonIndex);
    switch (error) {
      case 'invalid username':
        return i18next.t('menu:invalidLoginUsername');
      case 'invalid password':
        return i18next.t('menu:invalidLoginPassword');
      case 'account doesn\'t exist':
        return i18next.t('menu:accountNonExistent');
      case 'password doesn\'t match':
        return i18next.t('menu:unmatchingPassword');
    }

    return super.getReadableErrorMessage(error);
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      const config = args[0] as ModalConfig;

      const originalLoginAction = this.submitAction;
      this.submitAction = (_) => {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalLoginAction;
        this.sanitizeInputs();
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          this.scene.ui.setMode(Mode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          this.scene.ui.playError();
        };
        if (!this.inputs[0].text)
          return onFail(i18next.t('menu:emptyUsername'));
        Utils.apiPost(`account/login`, `username=${encodeURIComponent(this.inputs[0].text)}&password=${encodeURIComponent(this.inputs[1].text)}`, 'application/x-www-form-urlencoded')
          .then(response => {
            if (!response.ok)
              return response.text();
            return response.json();
          })
          .then(response => {
            if (response.hasOwnProperty('token')) {
              Utils.setCookie(Utils.sessionIdKey, response.token);
              originalLoginAction();
            } else
              onFail(response);
          });
      };

      return true;
    }

    return false;
  }
}