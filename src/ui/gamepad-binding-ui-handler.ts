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
    private listening: boolean = false;
    private buttonPressed = '';

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

        // this.optionSelectBg = addWindow(this.scene, this.scene.game.canvas.width / 12, -this.scene.game.canvas.height / 12, this.getWindowWidth(), -this.getWindowHeight());
        this.optionSelectBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28, this.getWindowWidth(), this.getWindowHeight());
        this.optionSelectBg.setOrigin(0.5);
        this.optionSelectContainer.add(this.optionSelectBg);

        this.unlockText = addTextObject(this.scene, 0, 0, 'Press a button...', TextStyle.WINDOW);
        this.unlockText.setOrigin(0, 0);
        this.unlockText.setPositionRelative(this.optionSelectBg, 36, 4);

        this.keyPressed = addTextObject(this.scene, 0, 0, '', TextStyle.WINDOW);
        this.keyPressed.setOrigin(0, 0);
        this.keyPressed.setPositionRelative(this.unlockText, 0, 12);
        this.keyPressed.setVisible(false);


        this.optionSelectContainer.add(this.unlockText);
        this.optionSelectContainer.add(this.keyPressed);
    }

    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        if (!this.listening) return;
        this.buttonPressed = button.index;
        const buttonLabel = this.scene.inputController.getButtonLabel(button);
        this.keyPressed.setText(buttonLabel);
        this.keyPressed.setVisible(true);
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