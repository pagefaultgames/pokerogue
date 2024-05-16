import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";
import {Device} from "#app/enums/devices";
import {getIconSpecialCase, getIconWithSettingName, getKeyWithKeycode} from "#app/configs/configHandler";


export default class GamepadBindingUiHandler extends AbstractBindingUiHandler {

    constructor(scene: BattleScene, mode: Mode) {
        super(scene, mode);
        // Listen to gamepad button down events to initiate binding.
        scene.input.gamepad.on('down', this.gamepadButtonDown, this);
    }

    getSelectedDevice() {
        return this.scene.inputController?.selectedDevice[Device.GAMEPAD];
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        const blacklist = [12, 13, 14, 15]; // d-pad buttons are blacklisted.
        // Check conditions before processing the button press.
        if (!this.listening || pad.id.toLowerCase() !== this.getSelectedDevice() || blacklist.includes(button.index) || this.buttonPressed !== null) return;
        const activeConfig = this.scene.inputController.getActiveConfig(Device.GAMEPAD);
        const type = activeConfig.padType
        const key = getKeyWithKeycode(activeConfig, button.index);
        const buttonIcon = activeConfig.icons[key];
        if (!buttonIcon) return;
        this.buttonPressed = button.index;
        const specialCaseIcon = getIconSpecialCase(activeConfig, button.index, this.target);
        const assignedButtonIcon = getIconWithSettingName(activeConfig, this.target);
        this.onInputDown(buttonIcon, specialCaseIcon || assignedButtonIcon, type);
    }

    swapAction(): boolean {
        const activeConfig = this.scene.inputController.getActiveConfig(Device.GAMEPAD);
        this.scene.inputController.swapBinding(activeConfig, this.target, this.buttonPressed)
        this.scene.gameData.saveMappingConfigs(this.getSelectedDevice(), activeConfig);
        return true;
    }
}