import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";


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
        const [type, buttonIcon] = this.scene.inputController.getPressedButtonLabel(button);
        if (!buttonIcon) return;
        const assignedButtonIcon = this.scene.inputController.getCurrentlyAssignedIconToDisplay(this.target);
        this.onInputDown(buttonIcon, assignedButtonIcon, type);
    }

    swapAction() {
        this.scene.inputController.swapBinding(this.target, this.buttonPressed);
        return true;
    }
}