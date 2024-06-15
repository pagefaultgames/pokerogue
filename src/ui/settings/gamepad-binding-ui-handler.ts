import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "./abstract-binding-ui-handler";
import {Mode} from "../ui";
import {Device} from "#enums/devices";
import {getIconWithSettingName, getKeyWithKeycode} from "#app/configs/inputs/configHandler";
import {addTextObject, TextStyle} from "#app/ui/text";


export default class GamepadBindingUiHandler extends AbstractBindingUiHandler {

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.scene.input.gamepad.on("down", this.gamepadButtonDown, this);
  }
  setup() {
    super.setup();

    // New button icon setup.
    this.newButtonIcon = this.scene.add.sprite(0, 0, "xbox");
    this.newButtonIcon.setPositionRelative(this.optionSelectBg, 78, 16);
    this.newButtonIcon.setOrigin(0.5);
    this.newButtonIcon.setVisible(false);

    this.swapText = addTextObject(this.scene, 0, 0, "will swap with", TextStyle.WINDOW);
    this.swapText.setOrigin(0.5);
    this.swapText.setPositionRelative(this.optionSelectBg, this.optionSelectBg.width / 2 - 2, this.optionSelectBg.height / 2 - 2);
    this.swapText.setVisible(false);

    this.targetButtonIcon = this.scene.add.sprite(0, 0, "xbox");
    this.targetButtonIcon.setPositionRelative(this.optionSelectBg, 78, 48);
    this.targetButtonIcon.setOrigin(0.5);
    this.targetButtonIcon.setVisible(false);

    this.actionLabel = addTextObject(this.scene, 0, 0, "Confirm swap", TextStyle.SETTINGS_LABEL);
    this.actionLabel.setOrigin(0, 0.5);
    this.actionLabel.setPositionRelative(this.actionBg, this.actionBg.width - 75, this.actionBg.height / 2);
    this.actionsContainer.add(this.actionLabel);

    this.optionSelectContainer.add(this.newButtonIcon);
    this.optionSelectContainer.add(this.swapText);
    this.optionSelectContainer.add(this.targetButtonIcon);
  }

  getSelectedDevice() {
    return this.scene.inputController?.selectedDevice[Device.GAMEPAD];
  }

  gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
    const blacklist = [12, 13, 14, 15]; // d-pad buttons are blacklisted.
    // Check conditions before processing the button press.
    if (!this.listening || pad.id.toLowerCase() !== this.getSelectedDevice() || blacklist.includes(button.index) || this.buttonPressed !== null) {
      return;
    }
    const activeConfig = this.scene.inputController.getActiveConfig(Device.GAMEPAD);
    const type = activeConfig.padType;
    const key = getKeyWithKeycode(activeConfig, button.index);
    const buttonIcon = activeConfig.icons[key];
    if (!buttonIcon) {
      return;
    }
    this.buttonPressed = button.index;
    const assignedButtonIcon = getIconWithSettingName(activeConfig, this.target);
    this.onInputDown(buttonIcon, assignedButtonIcon, type);
  }

  swapAction(): boolean {
    const activeConfig = this.scene.inputController.getActiveConfig(Device.GAMEPAD);
    if (this.scene.inputController.assignBinding(activeConfig, this.target, this.buttonPressed)) {
      this.scene.gameData.saveMappingConfigs(this.getSelectedDevice(), activeConfig);
      return true;
    }
    return false;
  }

  /**
     * Clear the UI elements and state.
     */
  clear() {
    super.clear();
    this.targetButtonIcon.setVisible(false);
    this.swapText.setVisible(false);
  }
}
