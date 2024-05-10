import UiHandler from "./ui-handler";
import BattleScene from "#app/battle-scene";
import {Mode} from "./ui";
import {Button} from "../enums/buttons";
import {addWindow} from "./ui-theme";
import {addTextObject, TextStyle} from "#app/ui/text";
import Phaser from "phaser";


export default class GamepadBindingUiHandler extends UiHandler {
    protected optionSelectContainer: Phaser.GameObjects.Container;
    protected optionSelectBg: Phaser.GameObjects.NineSlice;
    private unlockText: Phaser.GameObjects.Text;
    private keyPressed: Phaser.GameObjects.Text;
    private alreadyAssignedText: Phaser.GameObjects.Text;
    private listening: boolean = false;
    private buttonPressed = '';
    private iconXbox: Phaser.GameObjects.Sprite;
    private iconDualshock: Phaser.GameObjects.Sprite;

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
        this.optionSelectContainer.setVisible(false);
        ui.add(this.optionSelectContainer);

        this.titleBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + 28 + 22, this.getWindowWidth(), 24);
        this.titleBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.titleBg);

        this.unlockText = addTextObject(this.scene, 0, 0, 'Press a button...', TextStyle.WINDOW);
        this.unlockText.setOrigin(0, 0);
        this.unlockText.setPositionRelative(this.titleBg, 36, 4);
        this.optionSelectContainer.add(this.unlockText);

        this.optionSelectBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28, this.getWindowWidth(), this.getWindowHeight());
        this.optionSelectBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.optionSelectBg);

        this.iconXbox = this.scene.add.sprite(0, 0, 'xbox');
        this.iconXbox.setScale(0.2);
        this.iconXbox.setPositionRelative(this.optionSelectBg, 0, 0);
        this.iconXbox.setOrigin(0, 0);
        this.iconXbox.setVisible(false);

        this.iconDualshock = this.scene.add.sprite(0, 0, 'dualshock');
        this.iconDualshock.setScale(0.2);
        this.iconDualshock.setPositionRelative(this.optionSelectBg, this.optionSelectBg.width / 2, 0);
        this.iconDualshock.setOrigin(0, 0);
        this.iconDualshock.setVisible(false);

        this.alreadyAssignedText = addTextObject(this.scene, 0, 0, 'already assigned to', TextStyle.WINDOW);
        this.alreadyAssignedText.setOrigin(0, 0);
        this.alreadyAssignedText.setPositionRelative(this.optionSelectBg, this.optionSelectBg.width / 2, 24);


        this.optionSelectContainer.add(this.iconXbox);
        this.optionSelectContainer.add(this.iconDualshock);
        this.optionSelectContainer.add(this.alreadyAssignedText);
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        if (!this.listening || pad.id !== this.scene.inputController?.chosenGamepad) return;
        this.buttonPressed = button.index;
        const [type, buttonIcon] = this.scene.inputController.getButtonLabel(button);
        switch (type) {
            case 'dualshock':
                this.iconXbox.setVisible(false);
                this.iconDualshock.setFrame(buttonIcon);
                this.iconDualshock.setVisible(true);
                break
            case 'xbox':
            default:
                this.iconDualshock.setVisible(false);
                this.iconXbox.setFrame(buttonIcon);
                this.iconXbox.setVisible(true);
                break
        }
    }

    show(args: any[]): boolean {
        console.log('args', args);
        super.show(args);

        this.getUi().bringToTop(this.optionSelectContainer);

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
        const ui = this.getUi();
        return true;
    }

    clear() {
        super.clear();
    }

}