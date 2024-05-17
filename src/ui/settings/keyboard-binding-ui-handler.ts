import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";
import { getIconWithSettingName, getKeyWithKeycode} from "#app/configs/configHandler";
import {Device} from "#app/enums/devices";


export default class KeyboardBindingUiHandler extends AbstractBindingUiHandler {

    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
        // Listen to gamepad button down events to initiate binding.
        scene.input.keyboard.on('keydown', this.onKeyDown, this);
        this.confirmText = "Confirm";
    }

    getSelectedDevice() {
        return this.scene.inputController?.selectedDevice[Device.KEYBOARD];
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
        if (!this.listening || this.buttonPressed !== null || blacklist.includes(key)) return;
        const activeConfig = this.scene.inputController.getActiveConfig(Device.KEYBOARD);
        const _key = getKeyWithKeycode(activeConfig, key);
        const buttonIcon = activeConfig.icons[_key];
        if (!buttonIcon) return;
        this.buttonPressed = key;
        const assignedButtonIcon = getIconWithSettingName(activeConfig, this.target);
        this.onInputDown(buttonIcon, null, 'keyboard');
    }

    swapAction(): boolean {
        const activeConfig = this.scene.inputController.getActiveConfig(Device.KEYBOARD);
        if (this.scene.inputController.assignBinding(activeConfig, this.target, this.buttonPressed)) {
            this.scene.gameData.saveMappingConfigs(this.getSelectedDevice(), activeConfig);
            return true;
        }
        return false;
    }

}