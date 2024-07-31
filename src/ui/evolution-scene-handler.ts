import BattleScene from "../battle-scene";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import {Button} from "#enums/buttons";

export default class EvolutionSceneHandler extends MessageUiHandler {
  public evolutionContainer: Phaser.GameObjects.Container;
  public messageBg: Phaser.GameObjects.Image;
  public messageContainer: Phaser.GameObjects.Container;
  public canCancel: boolean;
  public cancelled: boolean;

  constructor(scene: BattleScene) {
    super(scene, Mode.EVOLUTION_SCENE);
  }

  setup() {
    this.canCancel = false;
    this.cancelled = false;

    const ui = this.getUi();

    this.evolutionContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    ui.add(this.evolutionContainer);

    const messageBg = this.scene.add.sprite(0, 0, "bg", this.scene.windowType);
    messageBg.setOrigin(0, 1);
    messageBg.setVisible(false);
    ui.add(messageBg);

    this.messageBg = messageBg;

    this.messageContainer = this.scene.add.container(12, -39);
    this.messageContainer.setVisible(false);
    ui.add(this.messageContainer);

    const message = addTextObject(this.scene, 0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780
      }
    });
    this.messageContainer.add(message);

    this.message = message;

    const prompt = this.scene.add.sprite(0, 0, "prompt");
    prompt.setVisible(false);
    prompt.setOrigin(0, 0);
    this.messageContainer.add(prompt);

    this.prompt = prompt;
  }

  show(_args: any[]): boolean {
    super.show(_args);

    this.scene.ui.bringToTop(this.evolutionContainer);
    this.scene.ui.bringToTop(this.messageBg);
    this.scene.ui.bringToTop(this.messageContainer);
    this.messageBg.setVisible(true);
    this.messageContainer.setVisible(true);

    return true;
  }

  processInput(button: Button): boolean {
    if (this.canCancel && !this.cancelled && button === Button.CANCEL) {
      this.cancelled = true;
      return true;
    }

    const ui = this.getUi();
    if (this.awaitingActionInput) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        if (this.onActionInput) {
          ui.playSelect();
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
          return true;
        }
      }
    }
  }

  setCursor(_cursor: integer): boolean {
    return false;
  }

  clear() {
    this.clearText();
    this.canCancel = false;
    this.cancelled = false;
    this.evolutionContainer.removeAll(true);
    this.messageContainer.setVisible(false);
    this.messageBg.setVisible(false);
  }
}
