import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { Button } from "#enums/buttons";
import { EggHatchPhase } from "#app/phases/egg-hatch-phase";
import { gScene } from "#app/battle-scene";

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
    super(Mode.EGG_HATCH_SCENE);
  }

  setup() {
    this.eggHatchContainer = gScene.add.container(0, -gScene.game.canvas.height / 6);
    gScene.fieldUI.add(this.eggHatchContainer);

    const eggLightraysAnimFrames = gScene.anims.generateFrameNames("egg_lightrays", { start: 0, end: 3 });
    if (!(gScene.anims.exists("egg_lightrays"))) {
      gScene.anims.create({
        key: "egg_lightrays",
        frames: eggLightraysAnimFrames,
        frameRate: 32
      });
    }
  }

  show(_args: any[]): boolean {
    super.show(_args);

    this.getUi().showText("", 0);

    gScene.setModifiersVisible(false);

    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.ACTION || button === Button.CANCEL) {
      const phase = gScene.getCurrentPhase();
      if (phase instanceof EggHatchPhase && phase.trySkip()) {
        return true;
      }
    }

    return gScene.ui.getMessageHandler().processInput(button);
  }

  setCursor(_cursor: integer): boolean {
    return false;
  }

  clear() {
    super.clear();
    this.eggHatchContainer.removeAll(true);
    this.getUi().hideTooltip();
  }
}
