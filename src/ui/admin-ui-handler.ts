import BattleScene from "#app/battle-scene.js";
import { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import { Button } from "#app/enums/buttons.js";

export default class AdminUiHandler extends FormModalUiHandler {

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
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return ["Link account", "Cancel"];
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
      };
      return true;
    }
    return false;

  }

  clear(): void {
    super.clear();
  }
}
