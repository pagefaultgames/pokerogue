import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { Button } from "#enums/buttons";
import { gScene } from "#app/battle-scene";

export default class EvolutionSceneHandler extends MessageUiHandler {
  public evolutionContainer: Phaser.GameObjects.Container;
  public messageBg: Phaser.GameObjects.Image;
  public messageContainer: Phaser.GameObjects.Container;
  public canCancel: boolean;
  public cancelled: boolean;

  constructor() {
    super(Mode.EVOLUTION_SCENE);
  }

  setup() {
    this.canCancel = false;
    this.cancelled = false;

    const ui = this.getUi();

    this.evolutionContainer = gScene.add.container(0, -gScene.game.canvas.height / 6);
    ui.add(this.evolutionContainer);

    const messageBg = gScene.add.sprite(0, 0, "bg", gScene.windowType);
    messageBg.setOrigin(0, 1);
    messageBg.setVisible(false);
    ui.add(messageBg);

    this.messageBg = messageBg;

    this.messageContainer = gScene.add.container(12, -39);
    this.messageContainer.setVisible(false);
    ui.add(this.messageContainer);

    const message = addTextObject(0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780
      }
    });
    this.messageContainer.add(message);

    this.message = message;

    this.initPromptSprite(this.messageContainer);
  }

  show(_args: any[]): boolean {
    super.show(_args);

    gScene.ui.bringToTop(this.evolutionContainer);
    gScene.ui.bringToTop(this.messageBg);
    gScene.ui.bringToTop(this.messageContainer);
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

    return false;
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
