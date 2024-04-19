import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";

export default class LoginFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return 'Login';
  }

  getFields(config?: ModalConfig): string[] {
    return [ 'Username', 'Password' ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ 'Log In', 'Register' ];
  }

  getReadableErrorMessage(error: string): string {
    let colonIndex = error?.indexOf(':');
    if (colonIndex > 0)
      error = error.slice(0, colonIndex);
    switch (error) {
      case 'invalid username':
        return 'The provided username is invalid';
      case 'invalid password':
        return 'The provided password is invalid';
      case 'account doesn\'t exist':
        return 'The provided user does not exist';
      case 'password doesn\'t match':
        return 'The provided password does not match';
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
          return onFail('Username must not be empty');
        const contentType = 'application/x-www-form-urlencoded';
        const headers = {
          'Content-Type': contentType,
        };
        fetch(`${Utils.apiUrl}/account/login`, { method: 'POST', headers: headers, body: `username=${encodeURIComponent(this.inputs[0].text)}&password=${encodeURIComponent(this.inputs[1].text)}` })
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