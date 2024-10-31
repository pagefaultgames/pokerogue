import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { Button } from "#enums/buttons";
import { gScene } from "#app/battle-scene";

export default abstract class AwaitableUiHandler extends UiHandler {
  protected awaitingActionInput: boolean;
  protected onActionInput: Function | null;
  public tutorialActive: boolean = false;
  public tutorialOverlay: Phaser.GameObjects.Rectangle;

  constructor(mode: Mode | null = null) {
    super(mode);
  }

  processTutorialInput(button: Button): boolean {
    if ((button === Button.ACTION || button === Button.CANCEL) && this.onActionInput) {
      this.getUi().playSelect();
      const originalOnActionInput = this.onActionInput;
      this.onActionInput = null;
      originalOnActionInput();
      this.awaitingActionInput = false;
      return true;
    }

    return false;
  }

  /**
   * Create a semi transparent overlay that will get shown during tutorials
   * @param container the container to add the overlay to
   */
  initTutorialOverlay(container: Phaser.GameObjects.Container) {
    if (!this.tutorialOverlay) {
      this.tutorialOverlay = new Phaser.GameObjects.Rectangle(gScene, -1, -1, gScene.scaledCanvas.width, gScene.scaledCanvas.height, 0x070707);
      this.tutorialOverlay.setName("tutorial-overlay");
      this.tutorialOverlay.setOrigin(0, 0);
      this.tutorialOverlay.setAlpha(0);
    }

    if (container) {
      container.add(this.tutorialOverlay);
    }
  }
}
