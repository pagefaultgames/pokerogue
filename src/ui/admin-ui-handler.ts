import BattleScene from "#app/battle-scene";
import { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import { Button } from "#app/enums/buttons";

export default class AdminUiHandler extends FormModalUiHandler {

  private adminMode: AdminMode;

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
    switch (this.adminMode) {
    case AdminMode.LINK:
      return ["Username", "Discord ID"];
    case AdminMode.UNLINK:
      return ["Username", "Discord ID"];
    default:
      return [""];
    }
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    switch (this.adminMode) {
    case AdminMode.LINK:
      return ["Link account", "Cancel"];
    case AdminMode.UNLINK:
      return ["Unlink account", "Cancel"];
    default:
      return ["Activate ADMIN", "Cancel"];
    }
  }

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  show(args: any[]): boolean {
    // this is used to remove the existing fields on the admin panel so they can be updated
    this.modalContainer.list = this.modalContainer.list.filter(mC => !mC.name.includes("formLabel"));

    this.adminMode = args[args.length - 1] as AdminMode;

    const fields = this.getFields();
    const hasTitle = !!this.getModalTitle();
    this.updateFields(fields, hasTitle);
    this.updateContainer(args[0]);

    const labels = this.getButtonLabels();
    for (let i = 0; i < labels.length; i++) {
      this.buttonLabels[i].setText(labels[i]);
    }

    this.errorMessage.setPosition(10, (hasTitle ? 31 : 5) + 20 * (fields.length - 1) + 16 + this.getButtonTopMargin());

    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      const originalSubmitAction = this.submitAction;
      this.submitAction = (_) => {
        this.submitAction = originalSubmitAction;
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          this.scene.ui.setMode(Mode.ADMIN, Object.assign(config, { errorMessage: error?.trim() }), this.adminMode);
          this.scene.ui.playError();
        };
        if (!this.inputs[0].text) {
          if (this.adminMode === AdminMode.LINK) {
            return onFail("Username is required");
          }
          if (this.adminMode === AdminMode.UNLINK && !this.inputs[1].text) {
            return onFail("Either username or discord Id is required");
          }
        }
        if (!this.inputs[1].text) {
          if (this.adminMode === AdminMode.LINK) {
            return onFail("Discord Id is required");
          }
          if (this.adminMode === AdminMode.UNLINK && !this.inputs[0].text) {
            return onFail("Either username or discord is required");
          }
        }
        if (this.adminMode === AdminMode.LINK) {
          Utils.apiPost("admin/account/discord-link", `username=${encodeURIComponent(this.inputs[0].text)}&discordId=${encodeURIComponent(this.inputs[1].text)}`, "application/x-www-form-urlencoded", true)
            .then(response => {
              if (!response.ok) {
                console.error(response);
              }
              this.inputs[0].setText("");
              this.inputs[1].setText("");
              // we double revert here and below to go back 2 layers of menus
              this.scene.ui.revertMode();
              this.scene.ui.revertMode();
            })
            .catch((err) => {
              console.error(err);
              this.scene.ui.revertMode();
              this.scene.ui.revertMode();
            });
        } else if (this.adminMode === AdminMode.UNLINK) {
          Utils.apiPost("admin/account/discord-unlink", `username=${encodeURIComponent(this.inputs[0].text)}&discordId=${encodeURIComponent(this.inputs[1].text)}`, "application/x-www-form-urlencoded", true)
            .then(response => {
              if (!response.ok) {
                console.error(response);
              }
              this.inputs[0].setText("");
              this.inputs[1].setText("");
              // we double revert here and below to go back 2 layers of menus
              this.scene.ui.revertMode();
              this.scene.ui.revertMode();
            })
            .catch((err) => {
              console.error(err);
              this.scene.ui.revertMode();
              this.scene.ui.revertMode();
            });
        }

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

export enum AdminMode {
  LINK,
  UNLINK
}


export function getAdminModeName(adminMode: AdminMode): string {
  switch (adminMode) {
  case AdminMode.LINK:
    return "Link";
  case AdminMode.UNLINK:
    return "Unlink";
  default:
    return "";
  }
}
