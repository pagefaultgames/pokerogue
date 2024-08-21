import BattleScene from "#app/battle-scene.js";
import { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import UiHandler from "./ui-handler";
import { Button } from "#app/enums/buttons.js";
import { addWindow } from "./ui-theme";
import { addTextObject, TextStyle } from "./text";

export default class AdminUiHandler extends UiHandler {
  private adminContainer: Phaser.GameObjects.Container;
  private submitAction: Function | null;
  private inputContainers: Phaser.GameObjects.Container[];
  private inputs: Phaser.GameObjects.Text[];

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.inputContainers = [];
    this.inputs = [];
  }

  setup(): void {
    const ui = this.getUi();

    this.adminContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.adminContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, "Admin", TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0,0);
    headerText.setPositionRelative(headerBg, 8, 4);

    // const usernameInputContainer = this.scene.add.container(0, 24);


    ui.add(this.adminContainer);
    this.setCursor(0);
    this.adminContainer.setVisible(false);
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return ["Link account"];
  }

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  show(args: any[]): boolean {
    super.show(args);
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
            return response.text();
          }
          return response.json();
        })
        .then(response => {
          this.scene.ui.setMode(Mode.ADMIN, config);
        });
      return false;
    };

    return true;
  }

  clear(): void {
    super.clear();
  }
}
