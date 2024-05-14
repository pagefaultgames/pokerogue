import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";
import {
    getKeyAndActionFromCurrentKeysWithSettingName, getKeyFromMapping, regenerateCustom,
} from "#app/configs/gamepad-utils";


export default class GamepadBindingUiHandler extends AbstractBindingUiHandler {

    constructor(scene: BattleScene, mode: Mode) {
        super(scene, mode);
        // Listen to gamepad button down events to initiate binding.
        scene.input.gamepad.on('down', this.gamepadButtonDown, this);
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        const blacklist = [12, 13, 14, 15]; // d-pad buttons are blacklisted.
        // Check conditions before processing the button press.
        if (!this.listening || pad.id !== this.scene.inputController?.chosenGamepad || blacklist.includes(button.index) || this.buttonPressed !== null) return;
        this.buttonPressed = button.index;
        const activeConfig = this.scene.inputController.getActiveConfig();
        const type = activeConfig.padType
        const key = getKeyFromMapping(activeConfig, this.buttonPressed);
        const buttonIcon = activeConfig.ogIcons[key];
        if (!buttonIcon) return;
        const assignedButtonIcon = getKeyAndActionFromCurrentKeysWithSettingName(activeConfig, this.target)?.icon;
        this.onInputDown(buttonIcon, assignedButtonIcon, type);
    }

    swapAction() {
        const activeConfig = this.scene.inputController.getActiveConfig();
        this.scene.inputController.swapBinding(activeConfig, this.target, this.buttonPressed)
        this.scene.gameData.saveCustomMapping(this.scene.inputController?.chosenGamepad, activeConfig.currentKeys, activeConfig.icons);
        regenerateCustom(activeConfig);
        return true;
    }
}