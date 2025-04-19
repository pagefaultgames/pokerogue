import { UiMode } from "#enums/ui-mode";
import UiHandler from "./ui-handler";
import { Button } from "#enums/buttons";
import { EggHatchPhase } from "#app/phases/egg-hatch-phase";
import { globalScene } from "#app/global-scene";

export default class EggHatchSceneHandler extends UiHandler {
  public eggHatchContainer: Phaser.GameObjects.Container;

  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode EggEventType.EGG_COUNT_CHANGED} {@linkcode EggCountChangedEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor() {
    super(UiMode.EGG_HATCH_SCENE);
  }

  setup() {
    this.eggHatchContainer = globalScene.add.container(0, -globalScene.game.canvas.height / 6);
    globalScene.fieldUI.add(this.eggHatchContainer);

    const eggLightraysAnimFrames = globalScene.anims.generateFrameNames("egg_lightrays", { start: 0, end: 3 });
    if (!globalScene.anims.exists("egg_lightrays")) {
      globalScene.anims.create({
        key: "egg_lightrays",
        frames: eggLightraysAnimFrames,
        frameRate: 32,
      });
    }
  }

  show(_args: any[]): boolean {
    super.show(_args);

    this.getUi().showText("", 0);

    globalScene.setModifiersVisible(false);

    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.ACTION || button === Button.CANCEL) {
      const phase = globalScene.getCurrentPhase();
      if (phase instanceof EggHatchPhase && phase.trySkip()) {
        return true;
      }
    }

    return globalScene.ui.getMessageHandler().processInput(button);
  }

  setCursor(_cursor: number): boolean {
    return false;
  }

  clear() {
    super.clear();
    this.eggHatchContainer.removeAll(true);
    this.getUi().hideTooltip();
  }
}
