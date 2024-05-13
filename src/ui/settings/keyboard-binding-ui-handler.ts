import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";


export default class KeyboardBindingUiHandler extends AbstractBindingUiHandler {

    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
        // Listen to gamepad button down events to initiate binding.
        scene.input.keyboard.on('keydown', this.onKeyDown, this);
    }

    onKeyDown(event): void {
        const key = event.keyCode;
        // // Check conditions before processing the button press.
        if (!this.listening || this.buttonPressed !== null) return;
        this.buttonPressed = key;
        const buttonIcon = this.scene.inputController.getPressedKeyLabel(key);
        if (!buttonIcon) return;
        const assignedButtonIcon = this.scene.inputController.getKeyboardCurrentlyAssignedIconToDisplay(this.target);
        this.onInputDown(buttonIcon, assignedButtonIcon, 'keyboard');
    }

    swapAction() {
        this.scene.inputController.swapKeyboardBinding(this.target, this.buttonPressed);
        return true;
    }

}