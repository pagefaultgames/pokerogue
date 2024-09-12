import BattleScene from "#app/battle-scene";
import { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import { Button } from "#app/enums/buttons";

export default class AdminUiHandler extends FormModalUiHandler {

  private unlinkAction: Function;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);
  }

  setup(): void {
    super.setup();
  }

  getModalTitle(config?: ModalConfig): string {
    return "Admin panel";
  }

  getFields(config?: ModalConfig): string[] {
    return ["Username", "Discord ID"];
  }

  getWidth(config?: ModalConfig): number {
    return 220;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return ["Link account", "Unlink account", "Cancel"];
  }

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      const originalSubmitAction = this.submitAction;
      let originAction: number = 0; // this is used to keep track of which button has been pressed
      /*  This code is here because currently the form-modal-ui-handler is hardcoded to only have a single action button and a cancel button
       *  This code below adds interactivity and a specific action to the unlink account button. This also sets up the originalAction variable
       *  from above, which lets us figure out if we're linking or unlinking, which makes this.submitAction do post different API calls
       */
      for (let i = 0; i < this.buttonBgs.length - 1; i++) {
        this.buttonBgs[i].off("pointerdown");
        this.buttonBgs[i].on("pointerdown", () => {
          originAction = i;
          if (this.submitAction) {
            this.submitAction();
          }
        });
      }
      this.submitAction = (_) => {
        this.submitAction = originalSubmitAction;
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          this.scene.ui.setMode(Mode.ADMIN, Object.assign(config, { errorMessage: error?.trim() }));
          this.scene.ui.playError();
        };
        if (!this.inputs[0].text) {
          return onFail("Username is required");
        }
        if (!this.inputs[1].text) {
          return onFail("Discord Id is required");
        }
        if (originAction === 0) {
          Utils.apiPost("admin/account/discord-link", `username=${encodeURIComponent(this.inputs[0].text)}&discordId=${encodeURIComponent(this.inputs[1].text)}`, "application/x-www-form-urlencoded", true)
            .then(response => {
              if (!response.ok) {
                console.error(response);
              }
              this.inputs[0].setText("");
              this.inputs[1].setText("");
              this.scene.ui.revertMode();
            })
            .catch((err) => {
              console.error(err);
              this.scene.ui.revertMode();
            });
          return false;
        } else if (originAction === 1) {
          Utils.apiPost("admin/account/discord-unlink", `username=${encodeURIComponent(this.inputs[0].text)}&discordId=${encodeURIComponent(this.inputs[1].text)}`, "application/x-www-form-urlencoded", true)
            .then(response => {
              if (!response.ok) {
                console.error(response);
              }
              this.inputs[0].setText("");
              this.inputs[1].setText("");
              this.scene.ui.revertMode();
            })
            .catch((err) => {
              console.error(err);
              this.scene.ui.revertMode();
            });
          return false;
        }
      };
      return true;
    }
    return false;

  }

  clear(): void {
    super.clear();
  }
}
