import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { addTextObject } from "#ui/text";

export class EvolutionSceneUiHandler extends MessageUiHandler {
  public evolutionContainer: Phaser.GameObjects.Container;
  public messageBg: Phaser.GameObjects.Image;
  public messageContainer: Phaser.GameObjects.Container;
  /**
   * A cancellation function set by the Phase using this UI handler.
   * If it is not set, cancel requests will be ignored.
   */
  public cancelFunc: (() => void) | undefined;

  constructor() {
    super(UiMode.EVOLUTION_SCENE);
  }

  setup() {
    const ui = this.getUi();

    this.evolutionContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);

    const messageBg = globalScene.add
      .sprite(0, 0, "bg", settings.display.uiWindowStyle)
      .setOrigin(0, 1)
      .setVisible(false);

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

    globalScene.ui
      .bringToTop(this.evolutionContainer)
      .bringToTop(this.messageBg.setVisible(true))
      .bringToTop(this.messageContainer.setVisible(true));

    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.CANCEL && this.cancelFunc != null) {
      this.cancelFunc();
      this.cancelFunc = undefined;
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
    this.cancelFunc = undefined;
    this.evolutionContainer.removeAll(true);
    this.messageContainer.setVisible(false);
    this.messageBg.setVisible(false);
  }
}
