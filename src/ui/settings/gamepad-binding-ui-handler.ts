import UiHandler from "../ui-handler";
import BattleScene from "#app/battle-scene";
import {Mode} from "../ui";
import {Button} from "../../enums/buttons";
import {addWindow} from "../ui-theme";
import {addTextObject, TextStyle} from "#app/ui/text";
import Phaser from "phaser";
import {SettingGamepad} from "../../system/settings-gamepad";


export default class GamepadBindingUiHandler extends UiHandler {
    // Containers for different segments of the UI.
    protected optionSelectContainer: Phaser.GameObjects.Container;
    protected actionsContainer: Phaser.GameObjects.Container;

    // Background elements for titles and action areas.
    protected titleBg: Phaser.GameObjects.NineSlice;
    protected actionBg: Phaser.GameObjects.NineSlice;
    protected optionSelectBg: Phaser.GameObjects.NineSlice;

    // Text elements for displaying instructions and actions.
    private unlockText: Phaser.GameObjects.Text;
    private swapText: Phaser.GameObjects.Text;
    private actionLabel: Phaser.GameObjects.Text;
    private cancelLabel: Phaser.GameObjects.Text;

    private listening: boolean = false;
    private buttonPressed: number | null = null;

    // Icons for displaying current and new button assignments.
    private newButtonIcon: Phaser.GameObjects.Sprite;
    private targetButtonIcon: Phaser.GameObjects.Sprite;

    // Function to call on cancel or completion of binding.
    private cancelFn: (boolean?) => boolean;

    // The specific setting being modified.
    private target: SettingGamepad;

    constructor(scene: BattleScene, mode: Mode = Mode.GAMEPAD_BINDING) {
        super(scene, mode);
        // Listen to gamepad button down events to initiate binding.
        scene.input.gamepad.on('down', this.gamepadButtonDown, this);
    }

    setup() {
        const ui = this.getUi();
        this.optionSelectContainer = this.scene.add.container(0, 0);
        this.actionsContainer = this.scene.add.container(0, 0);
        // Initially, containers are not visible.
        this.optionSelectContainer.setVisible(false);
        this.actionsContainer.setVisible(false);

        // Add containers to the UI.
        ui.add(this.optionSelectContainer);
        ui.add(this.actionsContainer);

        // Setup backgrounds and text objects for UI.
        this.titleBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + 28 + 21, this.getWindowWidth(), 24);
        this.titleBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.titleBg);

        this.actionBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28 + 21 + 21, this.getWindowWidth(), 24);
        this.actionBg.setOrigin(0.5);
        this.actionsContainer.add(this.actionBg);

        // Text prompts and instructions for the user.
        this.unlockText = addTextObject(this.scene, 0, 0, 'Press a button...', TextStyle.WINDOW);
        this.unlockText.setOrigin(0, 0);
        this.unlockText.setPositionRelative(this.titleBg, 36, 4);
        this.optionSelectContainer.add(this.unlockText);

        this.optionSelectBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28, this.getWindowWidth(), this.getWindowHeight());
        this.optionSelectBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.optionSelectBg);

        // New button icon setup.
        this.newButtonIcon = this.scene.add.sprite(0, 0, 'xbox');
        this.newButtonIcon.setScale(0.15);
        this.newButtonIcon.setPositionRelative(this.optionSelectBg, 78, 16);
        this.newButtonIcon.setOrigin(0.5);
        this.newButtonIcon.setVisible(false);

        this.swapText = addTextObject(this.scene, 0, 0, 'will swap with', TextStyle.WINDOW);
        this.swapText.setOrigin(0.5);
        this.swapText.setPositionRelative(this.optionSelectBg, this.optionSelectBg.width / 2 - 2, this.optionSelectBg.height / 2 - 2);
        this.swapText.setVisible(false);

        this.targetButtonIcon = this.scene.add.sprite(0, 0, 'xbox');
        this.targetButtonIcon.setScale(0.15);
        this.targetButtonIcon.setPositionRelative(this.optionSelectBg, 78, 48);
        this.targetButtonIcon.setOrigin(0.5);
        this.targetButtonIcon.setVisible(false);

        this.cancelLabel = addTextObject(this.scene, 0, 0, 'Cancel', TextStyle.SETTINGS_LABEL);
        this.cancelLabel.setOrigin(0, 0.5);
        this.cancelLabel.setPositionRelative(this.actionBg, 10, this.actionBg.height / 2);

        this.actionLabel = addTextObject(this.scene, 0, 0, 'Confirm Swap', TextStyle.SETTINGS_LABEL);
        this.actionLabel.setOrigin(0, 0.5);
        this.actionLabel.setPositionRelative(this.actionBg, this.actionBg.width - 75, this.actionBg.height / 2);

        // Add swap and cancel labels to the containers.
        this.optionSelectContainer.add(this.newButtonIcon);
        this.optionSelectContainer.add(this.swapText);
        this.optionSelectContainer.add(this.targetButtonIcon);
        this.actionsContainer.add(this.actionLabel);
        this.actionsContainer.add(this.cancelLabel);
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        const blacklist = [12, 13, 14, 15]; // d-pad buttons are blacklisted.
        // Check conditions before processing the button press.
        if (!this.listening || pad.id !== this.scene.inputController?.chosenGamepad || blacklist.includes(button.index) || this.buttonPressed !== null) return;
        this.buttonPressed = button.index;
        const [type, buttonIcon] = this.scene.inputController.getPressedButtonLabel(button);
        const assignedButtonIcon = this.scene.inputController.getCurrentlyAssignedIconToDisplay(this.target);
        this.newButtonIcon.setTexture(type);
        this.newButtonIcon.setFrame(buttonIcon);
        this.targetButtonIcon.setTexture(type);
        this.targetButtonIcon.setFrame(assignedButtonIcon);
        this.newButtonIcon.setVisible(true);
        this.targetButtonIcon.setVisible(true);
        this.swapText.setVisible(true);
        this.setCursor(0);
        this.actionsContainer.setVisible(true);
    }

    show(args: any[]): boolean {
        super.show(args);
        this.buttonPressed = null;
        this.cancelFn = args[0].cancelHandler;
        this.target = args[0].target;

        // Bring the option and action containers to the front of the UI.
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
                // Toggle between action and cancel options.
                const cursor = this.cursor ? 0 : 1;
                success = this.setCursor(cursor);
                break
            case Button.ACTION:
                // Process actions based on current cursor position.
                if (this.cursor === 0) {
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
        else
            ui.playError();

        return success;
    }

    setCursor(cursor: number): boolean {
        this.cursor = cursor;
        if (cursor === 1) {
            this.actionLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
            this.actionLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
            this.cancelLabel.setColor(this.getTextColor(TextStyle.WINDOW));
            this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
            return true;
        }
        this.actionLabel.setColor(this.getTextColor(TextStyle.WINDOW));
        this.actionLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
        this.cancelLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
        this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
        return true;
    }

    clear() {
        super.clear();
        this.target = null;
        this.cancelFn = null;
        this.optionSelectContainer.setVisible(false);
        this.actionsContainer.setVisible(false);
        this.newButtonIcon.setVisible(false);
        this.targetButtonIcon.setVisible(false);
        this.swapText.setVisible(false);
    }
}