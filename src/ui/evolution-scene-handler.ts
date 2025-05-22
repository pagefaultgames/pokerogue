import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { UiMode } from "#enums/ui-mode";
import { Button } from "#enums/buttons";
import { globalScene } from "#app/global-scene";

export default class EvolutionSceneHandler extends MessageUiHandler {
  public evolutionContainer: Phaser.GameObjects.Container;
  public messageBg: Phaser.GameObjects.Image;
  public messageContainer: Phaser.GameObjects.Container;
  public canCancel: boolean;
  public cancelled: boolean;

  constructor() {
    super(UiMode.EVOLUTION_SCENE);
  }

  setup() {
    this.canCancel = false;
    this.cancelled = false;

    const ui = this.getUi();

    this.evolutionContainer = globalScene.add.container(0, -globalScene.game.canvas.height / 6);
    ui.add(this.evolutionContainer);

    const messageBg = globalScene.add.sprite(0, 0, "bg", globalScene.windowType);
    messageBg.setOrigin(0, 1);
    messageBg.setVisible(false);
    ui.add(messageBg);

    this.messageBg = messageBg;

    this.messageContainer = globalScene.add.container(12, -39);
    this.messageContainer.setVisible(false);
    ui.add(this.messageContainer);

    const message = addTextObject(0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780,
      },
    });
    this.messageContainer.add(message);

    this.message = message;

    this.initPromptSprite(this.messageContainer);
  }

  show(_args: any[]): boolean {
    super.show(_args);

    globalScene.ui.bringToTop(this.evolutionContainer);
    globalScene.ui.bringToTop(this.messageBg);
    globalScene.ui.bringToTop(this.messageContainer);
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

  setCursor(_cursor: number): boolean {
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
