import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addTextObject } from "#ui/text";

export class EvolutionSceneHandler extends MessageUiHandler {
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

    this.evolutionContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);

    const messageBg = globalScene.add.sprite(0, 0, "bg", globalScene.windowType).setOrigin(0, 1).setVisible(false);

    this.messageBg = messageBg;

    this.messageContainer = globalScene.add.container(12, -39).setVisible(false);

    const message = addTextObject(0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780,
      },
    });
    this.messageContainer.add(message);

    ui.add([this.evolutionContainer, this.messageBg, this.messageContainer]);

    this.message = message;

    this.initPromptSprite(this.messageContainer);
  }

  show(_args: any[]): boolean {
    super.show(_args);

    globalScene.ui.bringToTop(this.evolutionContainer);
    globalScene.ui.bringToTop(this.messageBg.setVisible(true));
    globalScene.ui.bringToTop(this.messageContainer.setVisible(true));

    return true;
  }

  processInput(button: Button): boolean {
    if (this.canCancel && !this.cancelled && button === Button.CANCEL) {
      this.cancelled = true;
      return true;
    }

    const ui = this.getUi();
    if (this.awaitingActionInput && (button === Button.CANCEL || button === Button.ACTION) && this.onActionInput) {
      ui.playSelect();
      const originalOnActionInput = this.onActionInput;
      this.onActionInput = null;
      originalOnActionInput();
      return true;
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
