import UiHandler from "./ui-handler";
import BattleScene from "#app/battle-scene";
import {Mode} from "./ui";
import {Button} from "../enums/buttons";
import {addWindow} from "./ui-theme";
import {addTextObject, TextStyle} from "#app/ui/text";
import Phaser from "phaser";
import {SettingGamepad} from "../system/settings-gamepad";


export default class GamepadBindingUiHandler extends UiHandler {
    protected optionSelectContainer: Phaser.GameObjects.Container;
    protected actionsContainer: Phaser.GameObjects.Container;
    protected titleBg: Phaser.GameObjects.NineSlice;
    protected actionBg: Phaser.GameObjects.NineSlice;
    protected optionSelectBg: Phaser.GameObjects.NineSlice;
    private unlockText: Phaser.GameObjects.Text;
    private keyPressed: Phaser.GameObjects.Text;
    private alreadyAssignedText: Phaser.GameObjects.Text;
    private actionLabel: Phaser.GameObjects.Text;
    private cancelLabel: Phaser.GameObjects.Text;
    private listening: boolean = false;
    private buttonPressed = null;
    private iconXbox: Phaser.GameObjects.Sprite;
    private previousIconXbox: Phaser.GameObjects.Sprite;
    private iconDualshock: Phaser.GameObjects.Sprite;
    private cancelFn;
    private target: SettingGamepad;

    constructor(scene: BattleScene, mode: Mode = Mode.GAMEPAD_BINDING) {
        super(scene, mode);
        scene.input.gamepad.on('down', this.gamepadButtonDown, this);
    }

    // const loadSessionBg = this.scene.add.rectangle(this.scene.game.canvas.width / 24, -this.scene.game.canvas.height / 24, this.scene.game.canvas.width / 12, -this.scene.game.canvas.height / 12, 0x006860);
    // loadSessionBg.setOrigin(0, 0);
    // this.optionSelectContainer.add(loadSessionBg);
    setup() {
        const ui = this.getUi();
        this.optionSelectContainer = this.scene.add.container(0, 0);
        this.actionsContainer = this.scene.add.container(0, 0);
        this.optionSelectContainer.setVisible(false);
        this.actionsContainer.setVisible(false);
        ui.add(this.optionSelectContainer);
        ui.add(this.actionsContainer);

        this.titleBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + 28 + 21, this.getWindowWidth(), 24);
        this.titleBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.titleBg);

        this.actionBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28 + 21 + 21, this.getWindowWidth(), 24);
        this.actionBg.setOrigin(0.5);
        this.actionsContainer.add(this.actionBg);

        this.unlockText = addTextObject(this.scene, 0, 0, 'Press a button...', TextStyle.WINDOW);
        this.unlockText.setOrigin(0, 0);
        this.unlockText.setPositionRelative(this.titleBg, 36, 4);
        this.optionSelectContainer.add(this.unlockText);

        this.optionSelectBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28, this.getWindowWidth(), this.getWindowHeight());
        this.optionSelectBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.optionSelectBg);

        this.iconXbox = this.scene.add.sprite(0, 0, 'xbox');
        this.iconXbox.setScale(0.15);
        this.iconXbox.setPositionRelative(this.optionSelectBg, 78, 16);
        this.iconXbox.setOrigin(0.5);
        this.iconXbox.setVisible(false);

        this.iconDualshock = this.scene.add.sprite(0, 0, 'dualshock');
        this.iconDualshock.setScale(0.15);
        this.iconDualshock.setPositionRelative(this.optionSelectBg, 78, 16);
        this.iconDualshock.setOrigin(0.5);
        this.iconDualshock.setVisible(false);

        this.alreadyAssignedText = addTextObject(this.scene, 0, 0, 'will swap with', TextStyle.WINDOW);
        this.alreadyAssignedText.setOrigin(0.5);
        this.alreadyAssignedText.setPositionRelative(this.optionSelectBg, this.optionSelectBg.width / 2 - 2, this.optionSelectBg.height / 2 - 2);
        this.alreadyAssignedText.setVisible(false);

        this.previousIconXbox = this.scene.add.sprite(0, 0, 'xbox');
        this.previousIconXbox.setScale(0.15);
        this.previousIconXbox.setPositionRelative(this.optionSelectBg, 78, 48);
        this.previousIconXbox.setOrigin(0.5);
        this.previousIconXbox.setVisible(false);

        this.cancelLabel = addTextObject(this.scene, 0, 0, 'Cancel', TextStyle.SETTINGS_LABEL);
        this.cancelLabel.setOrigin(0, 0.5);
        this.cancelLabel.setPositionRelative(this.actionBg, 10, this.actionBg.height / 2);

        this.actionLabel = addTextObject(this.scene, 0, 0, 'Confirm Swap', TextStyle.SETTINGS_LABEL);
        this.actionLabel.setOrigin(0, 0.5);
        this.actionLabel.setPositionRelative(this.actionBg, this.actionBg.width - 75, this.actionBg.height / 2);


        this.optionSelectContainer.add(this.iconXbox);
        this.optionSelectContainer.add(this.iconDualshock);
        this.optionSelectContainer.add(this.alreadyAssignedText);
        this.optionSelectContainer.add(this.previousIconXbox);
        this.actionsContainer.add(this.actionLabel);
        this.actionsContainer.add(this.cancelLabel);
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        const blacklist = [12, 13, 14, 15];
        if (!this.listening || pad.id !== this.scene.inputController?.chosenGamepad || blacklist.includes(button.index) || this.buttonPressed !== null) return;
        this.buttonPressed = button.index;
        const [type, buttonIcon] = this.scene.inputController.getPressedButtonLabel(button);
        const assignedButtonIcon = this.scene.inputController.getCurrentButtonLabel(this.target);
        switch (type) {
            case 'dualshock':
                this.iconXbox.setVisible(false);
                this.iconDualshock.setFrame(buttonIcon);
                this.iconDualshock.setVisible(true);
                this.previousIconXbox.setVisible(true);
                this.alreadyAssignedText.setVisible(true);
                break
            case 'xbox':
            default:
                this.iconDualshock.setVisible(false);
                this.iconXbox.setFrame(buttonIcon);
                this.iconXbox.setVisible(true);
                this.previousIconXbox.setFrame(assignedButtonIcon);
                this.previousIconXbox.setVisible(true);
                this.alreadyAssignedText.setVisible(true);
                break
        }
        this.setCursor(0);
        this.actionsContainer.setVisible(true);
    }

    show(args: any[]): boolean {
        super.show(args);
        this.buttonPressed = null;
        this.cancelFn = args[0].cancelHandler;
        this.target = args[0].target;

        this.getUi().bringToTop(this.optionSelectContainer);
        this.getUi().bringToTop(this.actionsContainer);

        this.optionSelectContainer.setVisible(true);
        setTimeout(() => this.listening = true, 150);
        return true;
    }

    getWindowWidth(): number {
        return 160;
    }

    getWindowHeight(): number {
        return 64;
    }

    processInput(button: Button): boolean {
        if (this.buttonPressed === null) return;
        const ui = this.getUi();
        let success = false;
        switch (button) {
            case Button.LEFT:
            case Button.RIGHT:
                const cursor = this.cursor ? 0 : 1;
                success = this.setCursor(cursor);
                break
            case Button.ACTION:
                if (this.cursor === 0) {
                    success = true;
                    // Reverts UI to its previous state on cancel.
                    // this.scene.ui.revertMode();
                    this.cancelFn();
                } else {
                    success = true;
                    this.scene.inputController.swapBinding(this.target, this.buttonPressed);
                    this.cancelFn(success);
                }
                break;
        }

        // Plays a select sound effect if an action was successfully processed.
        if (success)
            ui.playSelect();

        return success;
    }

    setCursor(cursor: number): boolean {
        this.cursor = cursor;
        if (cursor === 1) {
            this.actionLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
            this.actionLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
            this.cancelLabel.setColor(this.getTextColor(TextStyle.WINDOW));
            this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
            return;
        }
        this.actionLabel.setColor(this.getTextColor(TextStyle.WINDOW));
        this.actionLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
        this.cancelLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
        this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
        return;
    }

    clear() {
        super.clear();
        this.target = null;
        this.cancelFn = null;
        this.optionSelectContainer.setVisible(false);
        this.actionsContainer.setVisible(false);
        this.iconXbox.setVisible(false);
        this.iconDualshock.setVisible(false);
        this.previousIconXbox.setVisible(false);
        this.alreadyAssignedText.setVisible(false);
        this.iconXbox.setFrame(null);
        this.iconDualshock.setFrame(null);
    }
}