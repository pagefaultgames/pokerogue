import Phaser from "phaser";
import {Mode} from "./ui/ui";
import {InputsController} from "./inputs-controller";
import MessageUiHandler from "./ui/message-ui-handler";
import StarterSelectUiHandler from "./ui/starter-select-ui-handler";
import {Setting, settingOptions} from "./system/settings";
import SettingsUiHandler from "./ui/settings-ui-handler";
import {Button} from "./enums/buttons";


export class UiInputs {
    private scene: Phaser.Scene;
    private events;
    private inputsController;

    constructor(scene: Phaser.Scene, inputsController: InputsController) {
        this.scene = scene;
        this.inputsController = inputsController;
        this.init();
    }

    init() {
        this.events = this.inputsController.events;
        this.listenInputs();
    }

    listenInputs(): void {
        this.events.on('input_down', (event) => {
            const actions = this.getActionsKeyDown();
            if (!actions.hasOwnProperty(event.button)) return;
            const [inputSuccess, vibrationLength] = actions[event.button]();
            if (inputSuccess && this.scene.enableVibration && typeof navigator.vibrate !== 'undefined')
                navigator.vibrate(vibrationLength);
        }, this);

        this.events.on('input_up', (event) => {
            const actions = this.getActionsKeyUp();
            if (!actions.hasOwnProperty(event.button)) return;
            const [inputSuccess, vibrationLength] = actions[event.button]();
            if (inputSuccess && this.scene.enableVibration && typeof navigator.vibrate !== 'undefined')
                navigator.vibrate(vibrationLength);
        }, this);
    }

    getActionsKeyDown() {
        const actions = {};
        actions[Button.UP] = () => this.buttonDirection(Button.UP);
        actions[Button.DOWN] = () => this.buttonDirection(Button.DOWN);
        actions[Button.LEFT] = () => this.buttonDirection(Button.LEFT);
        actions[Button.RIGHT] = () => this.buttonDirection(Button.RIGHT);
        actions[Button.SUBMIT] = () => this.buttonTouch();
        actions[Button.ACTION] = () => this.buttonAb(Button.ACTION);
        actions[Button.CANCEL] = () => this.buttonAb(Button.CANCEL);
        actions[Button.MENU] = () => this.buttonMenu();
        actions[Button.STATS] = () => this.buttonStats(true);
        actions[Button.CYCLE_SHINY] = () => this.buttonCycleOption(Button.CYCLE_SHINY);
        actions[Button.CYCLE_FORM] = () => this.buttonCycleOption(Button.CYCLE_FORM);
        actions[Button.CYCLE_GENDER] = () => this.buttonCycleOption(Button.CYCLE_GENDER);
        actions[Button.CYCLE_ABILITY] = () => this.buttonCycleOption(Button.CYCLE_ABILITY);
        actions[Button.CYCLE_NATURE] = () => this.buttonCycleOption(Button.CYCLE_NATURE);
        actions[Button.CYCLE_VARIANT] = () => this.buttonCycleOption(Button.CYCLE_VARIANT);
        actions[Button.SPEED_UP] = () => this.buttonSpeedChange();
        actions[Button.SLOW_DOWN] = () => this.buttonSpeedChange(false);
        return actions;
    }

    getActionsKeyUp() {
        const actions = {};
        actions[Button.STATS] = () => this.buttonStats(false);
        return actions;
    }

    buttonDirection(direction): Array<boolean | number> {
        const inputSuccess = this.scene.ui.processInput(direction);
        const vibrationLength = 5;
        return [inputSuccess, vibrationLength];
    }

    buttonAb(button): Array<boolean | number> {
        const inputSuccess = this.scene.ui.processInput(button);
        return [inputSuccess, 0];
    }

    buttonTouch(): Array<boolean | number> {
        const inputSuccess = this.scene.ui.processInput(Button.SUBMIT) || this.scene.ui.processInput(Button.ACTION);
        return [inputSuccess, 0];
    }

    buttonStats(pressed = true): Array<boolean | number> {
        if (pressed) {
            for (let p of this.scene.getField().filter(p => p?.isActive(true)))
                p.toggleStats(true);
        } else {
            for (let p of this.scene.getField().filter(p => p?.isActive(true)))
                p.toggleStats(false);
        }
        return [true, 0];
    }

    buttonMenu(): Array<boolean | number> {
        let inputSuccess;
        if (this.scene.disableMenu)
            return [true, 0];
        switch (this.scene.ui?.getMode()) {
            case Mode.MESSAGE:
                if (!(this.scene.ui.getHandler() as MessageUiHandler).pendingPrompt)
                    return [true, 0];
            case Mode.TITLE:
            case Mode.COMMAND:
            case Mode.FIGHT:
            case Mode.BALL:
            case Mode.TARGET_SELECT:
            case Mode.SAVE_SLOT:
            case Mode.PARTY:
            case Mode.SUMMARY:
            case Mode.STARTER_SELECT:
            case Mode.CONFIRM:
            case Mode.OPTION_SELECT:
                this.scene.ui.setOverlayMode(Mode.MENU);
                inputSuccess = true;
                break;
            case Mode.MENU:
            case Mode.SETTINGS:
            case Mode.ACHIEVEMENTS:
                this.scene.ui.revertMode();
                this.scene.playSound('select');
                inputSuccess = true;
                break;
            default:
                return [true, 0];
        }
        return [inputSuccess, 0];
    }

    buttonCycleOption(button): Array<boolean | number> {
        let inputSuccess;
        if (this.scene.ui?.getHandler() instanceof StarterSelectUiHandler) {
            inputSuccess = this.scene.ui.processInput(button);
        }
        return [inputSuccess, 0];
    }

    buttonSpeedChange(up = true): Array<boolean | number> {
        if (up) {
            if (this.scene.gameSpeed < 5) {
                this.scene.gameData.saveSetting(Setting.Game_Speed, settingOptions[Setting.Game_Speed].indexOf(`${this.scene.gameSpeed}x`) + 1);
                if (this.scene.ui?.getMode() === Mode.SETTINGS)
                    (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
            }
            return [0, 0];
        }
        if (this.scene.gameSpeed > 1) {
            this.scene.gameData.saveSetting(Setting.Game_Speed, Math.max(settingOptions[Setting.Game_Speed].indexOf(`${this.scene.gameSpeed}x`) - 1, 0));
            if (this.scene.ui?.getMode() === Mode.SETTINGS)
                (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
        }
        return [0, 0];
    }

}