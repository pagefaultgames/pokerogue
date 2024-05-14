import BattleScene from "../../battle-scene";
import AbstractBindingUiHandler from "../settings/abrast-binding-ui-handler";
import {Mode} from "../ui";
import {
    getKeyAndActionFromCurrentKeysWithSettingName, getKeyFromMapping, regenerateCustom,
} from "#app/configs/gamepad-utils";


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
        const activeConfig = this.scene.inputController.getActiveKeyboardConfig();
        const _key = getKeyFromMapping(activeConfig, key);
        const buttonIcon = activeConfig.ogIcons[_key];
        if (!buttonIcon) return;
        this.buttonPressed = key;
        const assignedButtonIcon = getKeyAndActionFromCurrentKeysWithSettingName(activeConfig, this.target)?.icon;
        this.onInputDown(buttonIcon, assignedButtonIcon, 'keyboard');
    }

    swapAction() {
        const activeConfig = this.scene.inputController.getActiveKeyboardConfig();
        this.scene.inputController.swapBinding(activeConfig, this.target, this.buttonPressed)
        this.scene.gameData.saveCustomKeyboardMapping(this.scene.inputController?.chosenKeyboard, activeConfig.currentKeys, activeConfig.icons);
        regenerateCustom(activeConfig);
        return true;
    }

}