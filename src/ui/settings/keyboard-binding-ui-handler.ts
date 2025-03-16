import AbstractBindingUiHandler from "./abstract-binding-ui-handler";
import type { Mode } from "../ui";
import { getKeyWithKeycode } from "#app/configs/inputs/configHandler";
import { Device } from "#enums/devices";
import { addTextObject, TextStyle } from "#app/ui/text";
import { globalScene } from "#app/global-scene";

export default class KeyboardBindingUiHandler extends AbstractBindingUiHandler {
  constructor(mode: Mode | null = null) {
    super(mode);
    // Listen to gamepad button down events to initiate binding.
    globalScene.input.keyboard?.on("keydown", this.onKeyDown, this);
  }

  setup() {
    super.setup();

    // New button icon setup.
    this.newButtonIcon = globalScene.add.sprite(0, 0, "keyboard");
    this.newButtonIcon.setPositionRelative(this.optionSelectBg, 78, 32);
    this.newButtonIcon.setOrigin(0.5);
    this.newButtonIcon.setVisible(false);

    this.actionLabel = addTextObject(0, 0, "Assign button", TextStyle.SETTINGS_LABEL);
    this.actionLabel.setOrigin(0, 0.5);
    this.actionLabel.setPositionRelative(this.actionBg, this.actionBg.width - 80, this.actionBg.height / 2);
    this.actionsContainer.add(this.actionLabel);

    this.optionSelectContainer.add(this.newButtonIcon);
  }

  getSelectedDevice() {
    return globalScene.inputController?.selectedDevice[Device.KEYBOARD];
  }

  onKeyDown(event): void {
    const blacklist = [
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.HOME,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.DELETE,
    ];
    const key = event.keyCode;
    // // Check conditions before processing the button press.
    if (!this.listening || this.buttonPressed !== null || blacklist.includes(key)) {
      return;
    }
    const activeConfig = globalScene.inputController.getActiveConfig(Device.KEYBOARD);
    const _key = getKeyWithKeycode(activeConfig, key);
    const buttonIcon = activeConfig.icons[_key];
    if (!buttonIcon) {
      return;
    }
    this.buttonPressed = key;
    // const assignedButtonIcon = getIconWithSettingName(activeConfig, this.target);
    this.onInputDown(buttonIcon, null, "keyboard");
  }

  swapAction(): boolean {
    const activeConfig = globalScene.inputController.getActiveConfig(Device.KEYBOARD);
    if (globalScene.inputController.assignBinding(activeConfig, this.target, this.buttonPressed)) {
      globalScene.gameData.saveMappingConfigs(this.getSelectedDevice(), activeConfig);
      return true;
    }
    return false;
  }
}
