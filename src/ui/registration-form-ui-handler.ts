import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import { TextStyle, addTextObject } from "./text";

export default class RegistrationFormUiHandler extends FormModalUiHandler {
  getModalTitle(config?: ModalConfig): string {
    return 'Register';
  }

  getFields(config?: ModalConfig): string[] {
    return [ 'Username', 'Password', 'Confirm Password' ];
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
    return [ 'Register', 'Back to Login' ];
  }

  getReadableErrorMessage(error: string): string {
    let colonIndex = error?.indexOf(':');
    if (colonIndex > 0)
      error = error.slice(0, colonIndex);
    switch (error) {
      case 'invalid username':
        return 'Username must only contain letters, numbers, or underscores';
      case 'invalid password':
        return 'Password must be 6 characters or longer';
      case 'failed to add account record':
        return 'The provided username is already in use';
    }

    return super.getReadableErrorMessage(error);
  }

  setup(): void {
    super.setup();

    const label = addTextObject(this.scene, 10, 87, 'By registering, you confirm you are of 13 years of age or older.', TextStyle.TOOLTIP_CONTENT, { fontSize: '42px' });

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
          return onFail('Username must not be empty');
        if (!this.inputs[1].text)
          return onFail(this.getReadableErrorMessage('invalid password'));
        if (this.inputs[1].text !== this.inputs[2].text)
          return onFail('Password must match confirm password');
        const contentType = 'application/x-www-form-urlencoded';
        const headers = {
          'Content-Type': contentType,
        };
        fetch(`${Utils.apiUrl}/account/register`, { method: 'POST', headers: headers, body: `username=${this.inputs[0].text}&password=${this.inputs[1].text}` })
          .then(response => response.text())
          .then(response => {
            if (!response) {
              fetch(`${Utils.apiUrl}/account/login`, { method: 'POST', headers: headers, body: `username=${this.inputs[0].text}&password=${this.inputs[1].text}` })
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