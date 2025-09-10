import { globalScene } from "#app/global-scene";
import { Device } from "#enums/devices";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { getIconWithSettingName, getKeyWithKeycode } from "#inputs/config-handler";
import { AbstractBindingUiHandler } from "#ui/handlers/abstract-binding-ui-handler";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class GamepadBindingUiHandler extends AbstractBindingUiHandler {
  constructor(mode: UiMode | null = null) {
    super(mode);
    globalScene.input.gamepad?.on("down", this.gamepadButtonDown, this);
  }
  setup() {
    super.setup();

    // New button icon setup.
    this.newButtonIcon = globalScene.add.sprite(0, 0, "xbox");
    this.newButtonIcon.setPositionRelative(this.optionSelectBg, 78, 16);
    this.newButtonIcon.setOrigin(0.5);
    this.newButtonIcon.setVisible(false);

    this.swapText = addTextObject(0, 0, i18next.t("settings:willSwapWith"), TextStyle.WINDOW);
    this.swapText.setOrigin(0.5);
    this.swapText.setPositionRelative(
      this.optionSelectBg,
      this.optionSelectBg.width / 2 - 2,
      this.optionSelectBg.height / 2 - 2,
    );
    this.swapText.setVisible(false);

    this.targetButtonIcon = globalScene.add.sprite(0, 0, "xbox");
    this.targetButtonIcon.setPositionRelative(this.optionSelectBg, 78, 48);
    this.targetButtonIcon.setOrigin(0.5);
    this.targetButtonIcon.setVisible(false);

    this.actionLabel = addTextObject(0, 0, i18next.t("settings:confirmSwap"), TextStyle.SETTINGS_LABEL);
    this.actionLabel.setOrigin(0, 0.5);
    this.actionLabel.setPositionRelative(this.actionBg, this.actionBg.width - 75, this.actionBg.height / 2);
    this.actionsContainer.add(this.actionLabel);

    this.optionSelectContainer.add(this.newButtonIcon);
    this.optionSelectContainer.add(this.swapText);
    this.optionSelectContainer.add(this.targetButtonIcon);
  }

  getSelectedDevice() {
    return globalScene.inputController?.selectedDevice[Device.GAMEPAD];
  }

  gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, _value: number): void {
    const blacklist = [12, 13, 14, 15]; // d-pad buttons are blacklisted.
    // Check conditions before processing the button press.
    if (
      !this.listening
      || pad.id.toLowerCase() !== this.getSelectedDevice()
      || blacklist.includes(button.index)
      || this.buttonPressed !== null
    ) {
      return;
    }
    const activeConfig = globalScene.inputController.getActiveConfig(Device.GAMEPAD);
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
    const activeConfig = globalScene.inputController.getActiveConfig(Device.GAMEPAD);
    if (globalScene.inputController.assignBinding(activeConfig, this.target, this.buttonPressed)) {
      globalScene.gameData.saveMappingConfigs(this.getSelectedDevice(), activeConfig);
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
